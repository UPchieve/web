import { test, expect } from '../fixtures.ts'
import { getClient } from '../db.ts'
import {
  createVolunteer,
  loginVolunteer,
  loginStudent,
  requestSession,
  withCertifications,
} from '../utils'

const dbClient = getClient()
test.describe('Session notifications', async () => {
  let volunteerUser

  test.beforeAll(async () => {
    volunteerUser = await createVolunteer(dbClient)
    await withCertifications(dbClient, {
      userId: volunteerUser.id,
      certificationNames: ['prealgebra'],
    })
  })

  test('Volunteer gets session notification', async ({ browser, student }) => {
    const { volunteerPage } = await loginVolunteer(browser, volunteerUser)
    await volunteerPage.goto('/profile')

    // Now that the volunteer is ready, request a session as a student
    const { studentDashboard } = await loginStudent(browser, student)
    const { sessionId } = await requestSession(studentDashboard, {
      topic: 'prealgebra',
      subject: 'math',
    })

    await expect(
      volunteerPage.getByTestId(`notification-${sessionId}`)
    ).toBeVisible()
  })
})
