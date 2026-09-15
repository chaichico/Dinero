import dotenv from 'dotenv'
dotenv.config({ path: '../../.env' })
import { checkDatabase, pool } from '../src/db'
const result = await checkDatabase()
console.log(`Neon connection OK: ${result.now}`)
await pool.end()
