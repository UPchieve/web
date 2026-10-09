import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import {
  createStudent,
  createVolunteer,
  endSessionsFor,
  loginVolunteer,
  loginStudent,
  requestSession,
  withCertifications,
} from '../utils'

let dbClient
test.describe('Session notifications', async () => {
  let studentUser
  let volunteerUser

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
    studentUser = await createStudent(dbClient)
    volunteerUser = await createVolunteer(dbClient)
    await withCertifications(dbClient, {
      userId: volunteerUser.id,
      certificationNames: ['prealgebra'],
    })
  })

  test.afterAll(async () => {
    endSessionsFor(dbClient, studentUser.id)
    await dbClient.release()
  })

  test('Volunteer gets session notification', async ({ browser }) => {
    const { volunteerPage } = await loginVolunteer(browser, volunteerUser)
    await volunteerPage.goto('/profile')

    // Now that the volunteer is ready, request a session as a student
    const { studentDashboard } = await loginStudent(browser, studentUser)
    const { sessionId } = await requestSession(studentDashboard, {
      topic: 'prealgebra',
      subject: 'math',
    })

    await expect(
      volunteerPage.getByTestId(`notification-${sessionId}`)
    ).toBeVisible()
  })
})
