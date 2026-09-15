import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: '../../.env' })
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } })
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations')
const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query('CREATE TABLE IF NOT EXISTS dinero_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())')
  for (const file of files) {
    if ((await client.query('SELECT 1 FROM dinero_migrations WHERE name=$1', [file])).rowCount) continue
    await client.query(await fs.readFile(path.join(directory, file), 'utf8'))
    await client.query('INSERT INTO dinero_migrations(name) VALUES($1)', [file])
    console.log(`Applied ${file}`)
  }
  await client.query('COMMIT')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
  await pool.end()
}
