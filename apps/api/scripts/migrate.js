import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('[migrate] ERROR: DATABASE_URL environment variable is required')
  process.exit(1)
}

const client = new Client({ connectionString: DATABASE_URL })

async function migrate() {
  await client.connect()
  console.log('[migrate] Connected to database')

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL      PRIMARY KEY,
      name       TEXT        NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const { rows } = await client.query(
      'SELECT id FROM _migrations WHERE name = $1',
      [file]
    )
    if (rows.length > 0) {
      console.log(`[migrate]   skip  ${file}`)
      continue
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`[migrate]   apply ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }

  console.log('[migrate] Done.')
}

migrate()
  .catch(err => {
    console.error('[migrate] FAILED:', err.message)
    process.exit(1)
  })
  .finally(() => client.end())
