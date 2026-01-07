import { test, expect } from '@playwright/test'
import { getClient } from '../db'
import { createStudent } from '../utils'
import type { PoolClient } from 'pg'

let dbClient: PoolClient
let testUser: any
test.beforeAll(async () => {
  dbClient = await getClient().connect()
  testUser = await createStudent(dbClient)
})

test('We are connected!', () => {
  console.log(testUser.email)
  expect(true).toBe(true)
})

test.afterAll(async () => {
  dbClient.release()
})
