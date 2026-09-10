import { Pool, type PoolClient } from 'pg'
import { postgresPort } from './utils/ports'

let client: Pool

function buildClient(): Pool {
  // TODO: Pull the credentials from environment variables too.
  const pool = new Pool({
    database: 'upchieve',
    user: 'admin',
    password: 'Password123',
    port: process.env.CI ? 5432 : Number(postgresPort),
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
