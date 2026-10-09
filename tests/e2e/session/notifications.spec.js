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

const dbClient = getClient()
test.describe('Session notifications', async () => {
  let studentUser
  let volunteerUser

  test.beforeAll(async () => {
    studentUser = await createStudent(dbClient)
    volunteerUser = await createVolunteer(dbClient)
    await withCertifications(dbClient, {
      userId: volunteerUser.id,
      certificationNames: ['prealgebra'],
    })
  })

  test.afterAll(async () => {
    await endSessionsFor(dbClient, studentUser.id)
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
