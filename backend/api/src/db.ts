import pg, { type PoolClient } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const { Pool } = pg
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_SIZE ?? 5),
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000
})

export async function checkDatabase() {
  return (await pool.query('SELECT NOW() AS now')).rows[0]
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

