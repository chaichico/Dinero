import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: '../../.env' })
const username = process.argv[2]
if (!username?.startsWith('test-')) throw new Error('Cleanup is restricted to usernames beginning with test-')
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } })
const result = await pool.query('DELETE FROM dinero_users WHERE username=$1', [username])
console.log(`Removed ${result.rowCount} test user(s)`)
await pool.end()

