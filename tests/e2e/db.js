import { Pool } from 'pg'
import { Ulid } from 'id128'
let client = undefined

function buildClient() {
  const pool = new Pool({
    database: 'upchieve',
    user: 'admin',
    password: 'Password123', // pragma: allowlist secret
    port: 5500,
    host: 'localhost',
  })
  pool.on('connect', async (client) => {
    await client.query('SET search_path TO upchieve;')
  })
  return pool
}

export function getClient() {
  if (!client) {
    client = buildClient()
  }
  return client
}

export function getDbUlid() {
  return Ulid.generate().toRaw()
}
