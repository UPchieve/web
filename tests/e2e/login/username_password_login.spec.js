import { test, expect } from '@playwright/test'
import { getClient } from '../db'
import { createUserRow } from '../utils'
import { Login } from '../page-object-models/login'
import { POSTHOG_FEATURE_FLAGS } from '../../../src/consts'

const BAD_CREDENTIALS_ERROR =
  "Oops! That email and password combination doesn't work. Check your password or if you signed up with Google SSO."

let dbClient
let testUser
test.beforeAll(async () => {
  dbClient = await getClient().connect()
  testUser = await createUserRow(dbClient)
})

test.afterAll(async () => {
  await dbClient.release()
})

const nameSuffix = (v) => {
  if (v) return '-new'
  return ''
}

for (const v of [true, false]) {
  test.describe('Username/password login' + nameSuffix(v), () => {
    test.beforeEach(async ({ page }) => {
      await page.route('*/**/feature-flags', async (route) => {
        const json = {
          featureFlags: {
            [POSTHOG_FEATURE_FLAGS.USE_NEW_SIGN_UP_FLOW]: v
          }
        }
        await route.fulfill({ json })
      })
      await page.goto('/', { timeout: 60000 })
    })

    test('Page has the correct title' + nameSuffix(v), async ({ page }) => {
      await expect(page).toHaveTitle('UPchieve')
      await expect(page.getByTestId('login-heading')).toBeVisible()
      await expect(page).toHaveScreenshot('page-load' + nameSuffix(v) + '.png')
    })

    test('Enable/disable logic works correctly' + nameSuffix(v), async ({ page }) => {
      const { email, password } = testUser
      const loginPage = new Login(page)
      await loginPage.isReady()
      await loginPage.fillFormWith({ email, password })
      await expect(loginPage.loginButton).toBeEnabled()
      await loginPage.fillFormWith({ email, password: '' })
      await expect(loginPage.loginButton).not.toBeEnabled()
      await loginPage.fillFormWith({ email, password })
      await expect(loginPage.loginButton).toBeEnabled()
      await expect(page).toHaveScreenshot('sign-in-btn-enabled' + nameSuffix(v) + '.png')
    })

    test('Logging in successfully' + nameSuffix(v), async ({ page }) => {
      const { email, password } = testUser
      const loginPage = new Login(page)
      await loginPage.loginWith({ email, password })
      await page.waitForURL('**/dashboard')
      await expect(page.getByTestId('dashboard-banner')).toBeVisible()
    })

    test('Error message appears when incorrect credentials are provided' + nameSuffix(v), async ({
      page,
    }) => {
      const { email } = testUser
      const loginPage = new Login(page)
      await loginPage.loginWith({ email, password: 'incorrectPassword456' })
      await loginPage.hasError(BAD_CREDENTIALS_ERROR, nameSuffix(v))
    })
  })
}
