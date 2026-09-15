import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { node } from '@elysiajs/node'
import dotenv from 'dotenv'
import { checkDatabase, pool, withTransaction } from './db'
import { authenticate, clearSessionCookie, createSession, ensureBootstrapAdmin, generatePassword, generateUsername, hashPassword, normalizeUsername, revokeSession, sessionCookie, verifyPassword } from './security'

dotenv.config({ path: '../../.env' })

const loginAttempts = new Map<string, { count: number; blockedUntil: number }>()
const cookieOf = (request: Request) => request.headers.get('cookie')
const validDate = (value: string) => !Number.isNaN(new Date(value).getTime())
const transactionBody = t.Object({ accountId: t.String(), title: t.String({ minLength: 1, maxLength: 120 }), amount: t.Number({ exclusiveMinimum: 0 }), type: t.Union([t.Literal('expense'), t.Literal('income')]), category: t.String({ minLength: 1, maxLength: 60 }), transactionDate: t.String(), note: t.Optional(t.String({ maxLength: 500 })) })
const transferBody = t.Object({ fromAccountId: t.String(), toAccountId: t.String(), amount: t.Number({ exclusiveMinimum: 0 }), transferDate: t.String(), note: t.Optional(t.String({ maxLength: 500 })) })

async function ownsAccounts(userId: string, accountIds: string[]) {
  const unique = [...new Set(accountIds)]
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM finance_accounts WHERE user_id=$1 AND id=ANY($2::uuid[])', [userId, unique])
  return result.rows[0].count === unique.length
}

async function uniqueGeneratedUsername() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const username = generateUsername()
    if (!(await pool.query('SELECT 1 FROM dinero_users WHERE LOWER(username)=$1', [username])).rowCount) return username
  }
  throw new Error('Could not generate a unique username')
}

export const app = new Elysia({ adapter: node(), name: 'dinero-api' })
  .use(cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000', credentials: true, allowedHeaders: ['Content-Type'] }))
  .get('/health', async () => ({ status: 'ok', database: await checkDatabase() }))
  .post('/api/auth/login', async ({ body, request, set, status }) => {
    const key = `${request.headers.get('x-forwarded-for') ?? 'local'}:${normalizeUsername(body.username)}`
    const attempt = loginAttempts.get(key)
    if (attempt && attempt.blockedUntil > Date.now()) return status(429, { message: 'Too many attempts. Try again later.' })
    const result = await pool.query('SELECT id,username,password_hash,role,status FROM dinero_users WHERE LOWER(username)=$1', [normalizeUsername(body.username)])
    const user = result.rows[0]
    const accepted = user?.status === 'active' && await verifyPassword(body.password, user.password_hash)
    if (!accepted) {
      const count = (attempt?.count ?? 0) + 1
      loginAttempts.set(key, { count, blockedUntil: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0 })
      return status(401, { message: 'Username or password is incorrect' })
    }
    loginAttempts.delete(key)
    await pool.query('UPDATE dinero_users SET last_login_at=NOW() WHERE id=$1', [user.id])
    const session = await createSession(user.id)
    set.headers['set-cookie'] = sessionCookie(session.token, session.expiresAt)
    return { data: { id: user.id, username: user.username, role: user.role } }
  }, { body: t.Object({ username: t.String({ minLength: 3, maxLength: 64 }), password: t.String({ minLength: 8, maxLength: 256 }) }) })
  .post('/api/auth/logout', async ({ request, set }) => { await revokeSession(cookieOf(request)); set.headers['set-cookie'] = clearSessionCookie(); return { ok: true } })
  .get('/api/auth/me', async ({ request, status }) => { const user = await authenticate(cookieOf(request)); return user ? { data: user } : status(401, { message: 'Authentication required' }) })

  .get('/api/admin/users', async ({ request, status }) => {
    const admin = await authenticate(cookieOf(request)); if (!admin) return status(401, { message: 'Authentication required' }); if (admin.role !== 'super_admin') return status(403, { message: 'Admin access required' })
    return { data: (await pool.query(`SELECT id,username,role,status,created_at AS "createdAt",last_login_at AS "lastLoginAt" FROM dinero_users ORDER BY role,created_at DESC`)).rows }
  })
  .post('/api/admin/users/generate', async ({ body, request, status }) => {
    const admin = await authenticate(cookieOf(request)); if (!admin) return status(401, { message: 'Authentication required' }); if (admin.role !== 'super_admin') return status(403, { message: 'Admin access required' })
    const username = body.username ? normalizeUsername(body.username) : await uniqueGeneratedUsername()
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) return status(400, { message: 'Username must be 3–32 lowercase letters, numbers, dots, dashes, or underscores' })
    const password = generatePassword()
    try {
      const user = await withTransaction(async (client) => {
        const created = await client.query(`INSERT INTO dinero_users(username,password_hash,role,status) VALUES($1,$2,'user','active') RETURNING id,username,role,status,created_at AS "createdAt"`, [username, await hashPassword(password)])
        await client.query(`INSERT INTO finance_accounts(user_id,name,type,opening_balance) VALUES($1,'Cash','cash',0)`, [created.rows[0].id])
        return created.rows[0]
      })
      return status(201, { data: { user, credentials: { username, password } } })
    } catch (error) { if ((error as { code?: string }).code === '23505') return status(409, { message: 'Username already exists' }); throw error }
  }, { body: t.Object({ username: t.Optional(t.String({ maxLength: 32 })) }) })
  .post('/api/admin/users/:id/reset-password', async ({ params, request, status }) => {
    const admin = await authenticate(cookieOf(request)); if (!admin) return status(401, { message: 'Authentication required' }); if (admin.role !== 'super_admin') return status(403, { message: 'Admin access required' })
    const target = await pool.query('SELECT id,username,role FROM dinero_users WHERE id=$1', [params.id]); if (!target.rowCount) return status(404, { message: 'User not found' }); if (target.rows[0].role === 'super_admin') return status(400, { message: 'Bootstrap admin is managed through environment variables' })
    const password = generatePassword()
    await withTransaction(async (client) => { await client.query('UPDATE dinero_users SET password_hash=$1,updated_at=NOW() WHERE id=$2', [await hashPassword(password), params.id]); await client.query('DELETE FROM dinero_sessions WHERE user_id=$1', [params.id]) })
    return { data: { credentials: { username: target.rows[0].username, password } } }
  }, { params: t.Object({ id: t.String() }) })
  .patch('/api/admin/users/:id/status', async ({ body, params, request, status }) => {
    const admin = await authenticate(cookieOf(request)); if (!admin) return status(401, { message: 'Authentication required' }); if (admin.role !== 'super_admin') return status(403, { message: 'Admin access required' })
    const target = await pool.query('SELECT role FROM dinero_users WHERE id=$1', [params.id]); if (!target.rowCount) return status(404, { message: 'User not found' }); if (target.rows[0].role === 'super_admin') return status(400, { message: 'Bootstrap admin cannot be deactivated here' })
    await withTransaction(async (client) => { await client.query('UPDATE dinero_users SET status=$1,updated_at=NOW() WHERE id=$2', [body.status, params.id]); if (body.status === 'inactive') await client.query('DELETE FROM dinero_sessions WHERE user_id=$1', [params.id]) })
    return { ok: true }
  }, { body: t.Object({ status: t.Union([t.Literal('active'), t.Literal('inactive')]) }), params: t.Object({ id: t.String() }) })
  .delete('/api/admin/users/:id', async ({ params, request, status }) => {
    const admin = await authenticate(cookieOf(request)); if (!admin) return status(401, { message: 'Authentication required' }); if (admin.role !== 'super_admin') return status(403, { message: 'Admin access required' })
    const target = await pool.query('SELECT role FROM dinero_users WHERE id=$1', [params.id]); if (!target.rowCount) return status(404, { message: 'User not found' }); if (target.rows[0].role === 'super_admin') return status(400, { message: 'Bootstrap admin cannot be deleted here' })
    await pool.query('DELETE FROM dinero_users WHERE id=$1', [params.id])
    return { ok: true }
  }, { params: t.Object({ id: t.String() }) })

  .get('/api/accounts', async ({ request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' })
    const result = await pool.query(`SELECT a.id,a.name,a.type,a.opening_balance::float AS "openingBalance",a.currency,a.is_archived AS "isArchived",(a.opening_balance+COALESCE((SELECT SUM(CASE WHEN t.type='income' THEN t.amount ELSE -t.amount END) FROM finance_transactions t WHERE t.account_id=a.id),0)+COALESCE((SELECT SUM(x.amount) FROM finance_transfers x WHERE x.to_account_id=a.id),0)-COALESCE((SELECT SUM(x.amount) FROM finance_transfers x WHERE x.from_account_id=a.id),0))::float AS balance FROM finance_accounts a WHERE a.user_id=$1 ORDER BY a.is_archived,a.created_at`, [user.id])
    return { data: result.rows }
  })
  .post('/api/accounts', async ({ body, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' })
    const result = await pool.query(`INSERT INTO finance_accounts(user_id,name,type,opening_balance) VALUES($1,$2,$3,$4) RETURNING id,name,type,opening_balance::float AS "openingBalance",currency,is_archived AS "isArchived"`, [user.id, body.name.trim(), body.type, body.openingBalance])
    return status(201, { data: { ...result.rows[0], balance: result.rows[0].openingBalance } })
  }, { body: t.Object({ name: t.String({ minLength: 1, maxLength: 80 }), type: t.Union([t.Literal('cash'), t.Literal('bank'), t.Literal('ewallet'), t.Literal('other')]), openingBalance: t.Number() }) })
  .patch('/api/accounts/:id', async ({ body, params, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' })
    const result = await pool.query('UPDATE finance_accounts SET name=COALESCE($1,name),type=COALESCE($2,type),is_archived=COALESCE($3,is_archived),opening_balance=COALESCE($4,opening_balance),updated_at=NOW() WHERE id=$5 AND user_id=$6 RETURNING id', [body.name?.trim() ?? null, body.type ?? null, body.isArchived ?? null, body.openingBalance ?? null, params.id, user.id])
    return result.rowCount ? { ok: true } : status(404, { message: 'Account not found' })
  }, { body: t.Object({ name: t.Optional(t.String({ minLength: 1, maxLength: 80 })), type: t.Optional(t.Union([t.Literal('cash'), t.Literal('bank'), t.Literal('ewallet'), t.Literal('other')])), isArchived: t.Optional(t.Boolean()), openingBalance: t.Optional(t.Number()) }), params: t.Object({ id: t.String() }) })

  .get('/api/transactions', async ({ query, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' })
    const values: unknown[] = [user.id]; const where = ['t.user_id=$1']
    if (query.type) { values.push(query.type); where.push(`t.type=$${values.length}`) }; if (query.accountId) { values.push(query.accountId); where.push(`t.account_id=$${values.length}`) }; if (query.start) { values.push(query.start); where.push(`t.transaction_date >= $${values.length}`) }; if (query.end) { values.push(query.end); where.push(`t.transaction_date < $${values.length}`) }
    values.push(Math.min(Number(query.limit ?? 100), 200))
    const result = await pool.query(`SELECT t.id,t.account_id AS "accountId",a.name AS "accountName",t.title,t.amount::float,t.type,t.category,t.transaction_date AS date,t.note FROM finance_transactions t JOIN finance_accounts a ON a.id=t.account_id WHERE ${where.join(' AND ')} ORDER BY t.transaction_date DESC LIMIT $${values.length}`, values)
    return { data: result.rows }
  }, { query: t.Object({ type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])), accountId: t.Optional(t.String()), start: t.Optional(t.String()), end: t.Optional(t.String()), limit: t.Optional(t.String()) }) })
  .get('/api/transactions/:id', async ({ params, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' })
    const result = await pool.query(`SELECT t.id,t.account_id AS "accountId",a.name AS "accountName",t.title,t.amount::float,t.type,t.category,t.transaction_date AS date,t.note FROM finance_transactions t JOIN finance_accounts a ON a.id=t.account_id WHERE t.id=$1 AND t.user_id=$2`, [params.id, user.id])
    return result.rowCount ? { data: result.rows[0] } : status(404, { message: 'Transaction not found' })
  }, { params: t.Object({ id: t.String() }) })
  .post('/api/transactions', async ({ body, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' }); if (!validDate(body.transactionDate)) return status(400, { message: 'Transaction date is invalid' }); if (!await ownsAccounts(user.id, [body.accountId])) return status(404, { message: 'Account not found' })
    const result = await pool.query(`INSERT INTO finance_transactions(user_id,account_id,title,amount,type,category,transaction_date,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,account_id AS "accountId",title,amount::float,type,category,transaction_date AS date,note`, [user.id, body.accountId, body.title.trim(), body.amount, body.type, body.category, body.transactionDate, body.note?.trim() || null])
    return status(201, { data: result.rows[0] })
  }, { body: transactionBody })
  .patch('/api/transactions/:id', async ({ body, params, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' }); if (!validDate(body.transactionDate) || !await ownsAccounts(user.id, [body.accountId])) return status(400, { message: 'Transaction details are invalid' })
    const result = await pool.query('UPDATE finance_transactions SET account_id=$1,title=$2,amount=$3,type=$4,category=$5,transaction_date=$6,note=$7,updated_at=NOW() WHERE id=$8 AND user_id=$9 RETURNING id', [body.accountId, body.title.trim(), body.amount, body.type, body.category, body.transactionDate, body.note?.trim() || null, params.id, user.id])
    return result.rowCount ? { ok: true } : status(404, { message: 'Transaction not found' })
  }, { body: transactionBody, params: t.Object({ id: t.String() }) })
  .delete('/api/transactions/:id', async ({ params, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' }); const result = await pool.query('DELETE FROM finance_transactions WHERE id=$1 AND user_id=$2', [params.id, user.id]); return result.rowCount ? { ok: true } : status(404, { message: 'Transaction not found' })
  }, { params: t.Object({ id: t.String() }) })

  .get('/api/transfers', async ({ request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' })
    return { data: (await pool.query(`SELECT x.id,x.from_account_id AS "fromAccountId",f.name AS "fromAccountName",x.to_account_id AS "toAccountId",d.name AS "toAccountName",x.amount::float,x.transfer_date AS date,x.note FROM finance_transfers x JOIN finance_accounts f ON f.id=x.from_account_id JOIN finance_accounts d ON d.id=x.to_account_id WHERE x.user_id=$1 ORDER BY x.transfer_date DESC`, [user.id])).rows }
  })
  .post('/api/transfers', async ({ body, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' }); if (body.fromAccountId === body.toAccountId) return status(400, { message: 'Choose two different accounts' }); if (!validDate(body.transferDate) || !await ownsAccounts(user.id, [body.fromAccountId, body.toAccountId])) return status(400, { message: 'Transfer details are invalid' })
    const result = await withTransaction((client) => client.query('INSERT INTO finance_transfers(user_id,from_account_id,to_account_id,amount,transfer_date,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [user.id, body.fromAccountId, body.toAccountId, body.amount, body.transferDate, body.note?.trim() || null])); return status(201, { data: result.rows[0] })
  }, { body: transferBody })
  .patch('/api/transfers/:id', async ({ body, params, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' }); if (body.fromAccountId === body.toAccountId || !validDate(body.transferDate) || !await ownsAccounts(user.id, [body.fromAccountId, body.toAccountId])) return status(400, { message: 'Transfer details are invalid' })
    const result = await withTransaction((client) => client.query('UPDATE finance_transfers SET from_account_id=$1,to_account_id=$2,amount=$3,transfer_date=$4,note=$5,updated_at=NOW() WHERE id=$6 AND user_id=$7 RETURNING id', [body.fromAccountId, body.toAccountId, body.amount, body.transferDate, body.note?.trim() || null, params.id, user.id])); return result.rowCount ? { ok: true } : status(404, { message: 'Transfer not found' })
  }, { body: transferBody, params: t.Object({ id: t.String() }) })
  .delete('/api/transfers/:id', async ({ params, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' }); const result = await withTransaction((client) => client.query('DELETE FROM finance_transfers WHERE id=$1 AND user_id=$2', [params.id, user.id])); return result.rowCount ? { ok: true } : status(404, { message: 'Transfer not found' })
  }, { params: t.Object({ id: t.String() }) })

  .get('/api/summary', async ({ query, request, status }) => {
    const user = await authenticate(cookieOf(request)); if (!user) return status(401, { message: 'Authentication required' }); if (!validDate(query.start) || !validDate(query.end)) return status(400, { message: 'Summary range is invalid' })
    const [totals, categories] = await Promise.all([pool.query(`SELECT COALESCE(SUM(amount) FILTER(WHERE type='income'),0)::float AS income,COALESCE(SUM(amount) FILTER(WHERE type='expense'),0)::float AS expense FROM finance_transactions WHERE user_id=$1 AND transaction_date >= $2 AND transaction_date < $3`, [user.id, query.start, query.end]), pool.query(`SELECT category,SUM(amount)::float AS amount FROM finance_transactions WHERE user_id=$1 AND type='expense' AND transaction_date >= $2 AND transaction_date < $3 GROUP BY category ORDER BY amount DESC`, [user.id, query.start, query.end])])
    const data = totals.rows[0]; return { data: { income: data.income, expense: data.expense, net: data.income - data.expense, categories: categories.rows } }
  }, { query: t.Object({ start: t.String(), end: t.String() }) })

await ensureBootstrapAdmin()
app.listen(Number(process.env.API_PORT ?? 3001))
console.log(`Dinero API listening on http://localhost:${process.env.API_PORT ?? 3001}`)
