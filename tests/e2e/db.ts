import { Pool, type PoolClient } from 'pg'

let client: Pool

function buildClient(): Pool {
  // TODO: Pull from environment variables instead.
  const pool = new Pool({
    database: 'upchieve',
    user: 'admin',
    password: 'Password123', // pragma: allowlist secret
    port: process.env.CI ? 5432 : 5500,
    host: process.env.CI ? 'postgres' : 'localhost',
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
