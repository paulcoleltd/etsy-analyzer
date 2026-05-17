import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

let _pool: Pool | null = null

export function getPool(): Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    _pool = new Pool({ connectionString: url, max: 20 })
  }
  return _pool
}

export function getDb() {
  return drizzle(getPool(), { schema })
}

export type Db = ReturnType<typeof getDb>
