import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { pool } from './db'

const SESSION_COOKIE = 'dinero_session'
const SESSION_DAYS = 7
const SCRYPT_KEY_LENGTH = 64

export type AuthUser = { id: string; username: string; role: 'super_admin' | 'user'; status: 'active' | 'inactive' }

function scrypt(password: string, salt: Buffer, length = SCRYPT_KEY_LENGTH): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error)
      else resolve(key as Buffer)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt)
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, n, r, p, saltValue, hashValue] = encoded.split('$')
  if (algorithm !== 'scrypt' || !saltValue || !hashValue || n !== '16384' || r !== '8' || p !== '1') return false
  try {
    const expected = Buffer.from(hashValue, 'base64url')
    const actual = await scrypt(password, Buffer.from(saltValue, 'base64url'), expected.length)
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch { return false }
}

export function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  return [...randomBytes(18)].map((byte) => alphabet[byte % alphabet.length]).join('')
}

export function generateUsername(): string { return `member-${randomBytes(4).toString('hex')}` }
export function normalizeUsername(username: string): string { return username.trim().toLowerCase() }
export function tokenHash(token: string): string { return createHash('sha256').update(token).digest('hex') }

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await pool.query('INSERT INTO dinero_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [userId, tokenHash(token), expiresAt])
  return { token, expiresAt }
}

export function readSessionToken(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null
  for (const entry of cookieHeader.split(';')) {
    const [name, ...value] = entry.trim().split('=')
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join('='))
  }
  return null
}

export async function authenticate(cookieHeader?: string | null): Promise<AuthUser | null> {
  const token = readSessionToken(cookieHeader)
  if (!token) return null
  const result = await pool.query<AuthUser>(`SELECT u.id, u.username, u.role, u.status FROM dinero_sessions s JOIN dinero_users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.status = 'active'`, [tokenHash(token)])
  return result.rows[0] ?? null
}

export async function revokeSession(cookieHeader?: string | null): Promise<void> {
  const token = readSessionToken(cookieHeader)
  if (token) await pool.query('DELETE FROM dinero_sessions WHERE token_hash = $1', [tokenHash(token)])
}

export function sessionCookie(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

export async function ensureBootstrapAdmin(): Promise<void> {
  const username = process.env.SUPER_ADMIN_USERNAME
  const passwordHash = process.env.SUPER_ADMIN_PASSWORD_HASH
  if (!username || !passwordHash) {
    console.warn('SUPER_ADMIN_USERNAME or SUPER_ADMIN_PASSWORD_HASH is not configured; admin login is unavailable')
    return
  }
  await pool.query(`INSERT INTO dinero_users (username, password_hash, role, status) VALUES ($1, $2, 'super_admin', 'active') ON CONFLICT (LOWER(username)) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'super_admin', status = 'active', updated_at = NOW()`, [normalizeUsername(username), passwordHash])
}

