import { test, expect } from '@playwright/test'
import { getClient } from '../db'
import { createUserRow } from '../utils'
import { Login } from '../page-object-models/login'
const BAD_CREDENTIALS_ERROR =
  "Oops! That email and password combination doesn't work. Check your password or if you signed up with Google SSO."
let dbClient
test.describe('Username/password login', async () => {
  let testUser

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
    testUser = await createUserRow(dbClient)
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Page has the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('UPchieve')
    await expect(page.getByTestId('login-heading')).toBeVisible()
    await expect(page).toHaveScreenshot('page-load.png')
  })

  test('Enable/disable logic works correctly', async ({ page }) => {
    const { email, password } = testUser
    const loginPage = new Login(page)
    await loginPage.isReady()
    await loginPage.fillFormWith({ email, password })
    await expect(loginPage.loginButton).toBeEnabled()
    await loginPage.fillFormWith({ email, password: '' })
    await expect(loginPage.loginButton).not.toBeEnabled()
    await loginPage.fillFormWith({ email, password })
    await expect(loginPage.loginButton).toBeEnabled()
    await expect(page).toHaveScreenshot('sign-in-btn-enabled.png')
  })

  test('Logging in successfully', async ({ page }) => {
    const { email, password } = testUser
    const loginPage = new Login(page)
    await loginPage.loginWith({ email, password })
    await page.waitForURL('**/dashboard')
    await expect(page.getByTestId('dashboard-banner')).toBeVisible()
  })

  test('Error message appears when incorrect credentials are provided', async ({
    page,
  }) => {
    const { email } = testUser
    const loginPage = new Login(page)
    await loginPage.loginWith({ email, password: 'incorrectPassword456' })
    await loginPage.hasError(BAD_CREDENTIALS_ERROR)
  })
})
