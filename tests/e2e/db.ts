import { Pool, type PoolClient } from 'pg'

let client: Pool

function buildClient(): Pool {
  const pool = new Pool({
    database: 'upchieve',
    user: 'admin',
    password: 'Password123', // pragma: allowlist secret
    port: 5500,
    host: 'localhost',
  })
  pool.on('connect', async (client: PoolClient) => {
    await client.query('SET search_path TO upchieve;')
  })
  return pool
}

export function getClient(): Pool {
  if (!client) {
    client = buildClient()
  }
  return client
}
