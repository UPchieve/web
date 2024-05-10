// import { expect, test } from '@playwright/test'
import { test } from '@playwright/test'
import { getClient } from '../db.js'
import {
  createStudent,
  createVolunteer,
  endSessionsFor,
  withCertifications,
} from '../utils.js'
import { SessionView } from '../page-object-models/session-view.js'
import { StudentDashboard } from '../page-object-models/student-dashboard.js'
import { Login } from '../page-object-models/login.js'
import { VolunteerDashboard } from '../page-object-models/volunteer-dashboard.js'

let dbClient
test.describe('Session', async () => {
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
    await endSessionsFor(dbClient, studentUser.id)
    await dbClient.release()
  })

  test('can chat', async ({ browser }) => {
    /* Sign in student */
    const studentContext = await browser.newContext()
    const studentPage = await studentContext.newPage()
    const studentDashboard = new StudentDashboard(studentPage)
    const studentSessionView = new SessionView(studentPage)
    const studentLogin = new Login(studentPage)
    await studentLogin.goto()
    await studentLogin.loginWith(studentUser)
    await studentPage.waitForURL('**/dashboard')
    if (studentDashboard.isMobile) {
      await studentPage.getByTestId('download-app-close-button').click()
    }

    /* Sign in volunteer */
    const volunteerContext = await browser.newContext()
    const volunteerPage = await volunteerContext.newPage()
    const volunteerSessionView = new SessionView(volunteerPage)
    const volunteerDashboard = new VolunteerDashboard(volunteerPage)
    const volunteerLogin = new Login(volunteerPage)
    await volunteerLogin.goto()
    await volunteerLogin.loginWith(volunteerUser)
    await volunteerPage.waitForURL('**/dashboard')

    await studentDashboard.createSessionFor({
      subject: 'math',
      topic: 'prealgebra',
    })
    const studentMessage = `hello from ${studentUser.firstName}`
    await studentSessionView.sendMessage(studentMessage)

    await volunteerDashboard.joinSessionFor(studentUser.firstName)
    await volunteerSessionView.hasMessage(studentMessage)

    const volunteerMessage = `hi from ${volunteerUser.firstName}`
    await volunteerSessionView.sendMessage(volunteerMessage)

    await studentSessionView.hasMessage(volunteerMessage)
  })
})
