import { test as base } from '@playwright/test'
import { getClient } from './db.ts'
import { createStudent, endSessionsFor, type StudentUser } from './utils.ts'

export { expect } from '@playwright/test'

export const test = base.extend<{ student: StudentUser }>({
  // A new student per test, whose sessions end when the test does, pass or fail.
  // Playwright reads a fixture's dependencies from this destructuring.
  // eslint-disable-next-line no-empty-pattern
  student: async ({}, use) => {
    const dbClient = getClient()
    const student = await createStudent(dbClient)
    await use(student)
    await endSessionsFor(dbClient, student.id)
  },
})
