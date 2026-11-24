import { expect, test } from '../fixtures.ts'
import { loginStudent, requestSession } from '../utils.ts'

test.describe('Session whiteboard', () => {
  test('authorizes and connects a Zwibserve whiteboard', async ({
    browser,
    student,
  }) => {
    const { studentContext, studentPage, studentDashboard } =
      await loginStudent(browser, student)

    const tokenResponse = studentPage.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/api\/session\/[^/]+\/whiteboard-token$/.test(
          new URL(response.url()).pathname
        )
    )

    await requestSession(studentDashboard, {
      subject: 'math',
      topic: 'prealgebra',
    })

    expect((await tokenResponse).status()).toBe(200)
    await expect(studentPage.locator('#zwib-div')).toBeAttached()
    await expect(
      studentPage.getByText('Attempting to connect the whiteboard')
    ).toBeHidden({ timeout: 15_000 })
    await expect(
      studentPage.getByText(
        'Failed to connect to the whiteboard. Please refresh your page.'
      )
    ).toBeHidden()

    await studentContext.close()
  })
})
