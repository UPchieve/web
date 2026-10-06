import { expect, test } from '@playwright/test'
import { getClient } from '../db.ts'
import {
  createStudent,
  createVolunteer,
  endSessionsFor,
  loginStudent,
  loginVolunteer,
  withCertifications,
} from '../utils.ts'
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

    const { sessionId } = await studentDashboard.createSessionFor({
      subject: 'math',
      topic: 'prealgebra',
    })
    if (!studentDashboard.isMobile) {
      await studentDashboard.dismissNotificationModal()
    }

    const studentMessage = `hello from ${studentUser.firstName}`
    await studentSessionView.sendMessage(studentMessage)

    await volunteerDashboard.joinSessionFor(sessionId)
    await volunteerSessionView.hasMessage(studentMessage)

    const volunteerMessage = `hi from ${volunteerUser.firstName}`
    await volunteerSessionView.sendMessage(volunteerMessage)

    await studentSessionView.hasMessage(volunteerMessage)
  })

  test('lands on the review after reloading an ended session', async ({
    browser,
  }) => {
    const student = await createStudent(dbClient)
    const volunteer = await createVolunteer(dbClient)
    await withCertifications(dbClient, {
      userId: volunteer.id,
      certificationNames: ['prealgebra'],
    })

    const { studentContext, studentPage, studentDashboard } =
      await loginStudent(browser, student)
    const { volunteerContext, volunteerPage } = await loginVolunteer(
      browser,
      volunteer
    )
    const studentSessionView = new SessionView(studentPage)
    const volunteerSessionView = new SessionView(volunteerPage)

    const { sessionId } = await studentDashboard.createSessionFor({
      subject: 'math',
      topic: 'prealgebra',
    })
    if (!studentDashboard.isMobile) {
      await studentDashboard.dismissNotificationModal()
    }

    await studentSessionView.sendMessage(`hello from ${student.firstName}`)
    await new VolunteerDashboard(volunteerPage).joinSessionFor(sessionId)
    await volunteerSessionView.hasMessage(`hello from ${student.firstName}`)
    await volunteerSessionView.sendMessage(`hi from ${volunteer.firstName}`)
    await studentSessionView.hasMessage(`hi from ${volunteer.firstName}`)
    const reply = `thanks from ${student.firstName}`
    await studentSessionView.sendMessage(reply)
    await volunteerSessionView.hasMessage(reply)

    await endSessionsFor(dbClient, student.id)
    await studentPage.reload()

    await studentPage.waitForURL(`**/feedback/${sessionId}`)
    await studentContext.close()
    await volunteerContext.close()
  })

  test('shows the ended session in place after the connection comes back', async ({
    browser,
  }) => {
    // Two sign-ins, a session, and up to 15 s for the reconnect.
    test.slow()
    const student = await createStudent(dbClient)
    const volunteer = await createVolunteer(dbClient)
    await withCertifications(dbClient, {
      userId: volunteer.id,
      certificationNames: ['prealgebra'],
    })

    const { studentContext, studentPage, studentDashboard } =
      await loginStudent(browser, student)
    // The session page asks for notifications while the permission is unset.
    await studentContext.grantPermissions(['notifications'])
    const studentSessionView = new SessionView(studentPage)

    // Routes only catch connections opened after they are set, so they go in
    // before the volunteer signs in and the app opens its socket.
    const volunteerContext = await browser.newContext()
    let isVolunteerOffline = false
    const volunteerSockets = []
    let strippedRestoreIds = 0
    // The server restores a connection and replays what it missed for up to 2
    // minutes, so dropping the restore ids takes the longer-absence path.
    await volunteerContext.route(/\/socket\.io\//, (route) => {
      if (isVolunteerOffline) return route.abort()
      const postData = route.request().postData()
      if (!postData?.includes('40{')) return route.continue()
      const packets = postData.split('\x1e').map((packet) => {
        if (!packet.startsWith('40{')) return packet
        const auth = JSON.parse(packet.slice(2))
        if (auth.pid) strippedRestoreIds++
        delete auth.pid
        delete auth.offset
        return `40${JSON.stringify(auth)}`
      })
      return route.continue({ postData: packets.join('\x1e') })
    })
    await volunteerContext.routeWebSocket(/\/socket\.io\//, (ws) => {
      if (isVolunteerOffline) return ws.close()
      volunteerSockets.push(ws, ws.connectToServer())
    })
    const volunteerPage = await volunteerContext.newPage()
    const volunteerLogin = new Login(volunteerPage)
    await volunteerLogin.goto()
    await volunteerLogin.loginWith(volunteer)
    await volunteerPage.waitForURL('**/dashboard')
    const volunteerSessionView = new SessionView(volunteerPage)
    const isVolunteerSocketConnected = () =>
      volunteerPage.evaluate(
        () =>
          document.querySelector('#mount').__vue_app__.config.globalProperties
            .$store.state.socket.isConnected
      )

    const { sessionId } = await studentDashboard.createSessionFor({
      subject: 'math',
      topic: 'prealgebra',
    })

    await studentSessionView.sendMessage(`hello from ${student.firstName}`)
    await new VolunteerDashboard(volunteerPage).joinSessionFor(sessionId)
    await volunteerSessionView.hasMessage(`hello from ${student.firstName}`)
    await volunteerSessionView.sendMessage(`hi from ${volunteer.firstName}`)
    await studentSessionView.hasMessage(`hi from ${volunteer.firstName}`)

    isVolunteerOffline = true
    await Promise.all(volunteerSockets.map((socket) => socket.close()))
    await expect.poll(isVolunteerSocketConnected).toBe(false)

    if (studentDashboard.isMobile) {
      await studentPage.locator('.menu .toggle').click()
    }
    await studentPage
      .locator('.end-session-button')
      .filter({ visible: true })
      .click()
    await studentPage.getByRole('button', { name: 'Yes, End Session' }).click()
    await studentPage.waitForURL('**/dashboard')
    expect(await isVolunteerSocketConnected()).toBe(false)

    // socket.io backs off up to 5 s between reconnect attempts.
    isVolunteerOffline = false
    await expect
      .poll(isVolunteerSocketConnected, { timeout: 15_000 })
      .toBe(true)
    // Without a stripped id the server restores the session and this test
    // passes without reaching the refused join.
    expect(strippedRestoreIds).toBeGreaterThan(0)
    await expect(
      volunteerPage.getByText('Session ended', { exact: true })
    ).toBeVisible({ timeout: 15_000 })
    await expect(volunteerPage.getByText('Session Chat Error')).toBeHidden()
    expect(volunteerPage.url()).toContain(sessionId)

    // The ended screen can render before the chat room join finishes, and
    // sendMessage only waits out the connecting banner of a live session.
    const followUp = `thanks from ${volunteer.firstName}`
    await volunteerPage.getByTestId('chat-textarea').fill(followUp)
    await expect(volunteerPage.locator('.send-button')).toBeEnabled()
    await volunteerPage.keyboard.press('Enter')
    await volunteerSessionView.hasMessage(followUp)
    await expect
      .poll(async () => {
        const { rows } = await dbClient.query(
          'SELECT 1 FROM session_messages WHERE session_id = $1 AND contents = $2',
          [sessionId, followUp]
        )
        return rows.length
      })
      .toBe(1)
    await studentContext.close()
    await volunteerContext.close()
  })
})
