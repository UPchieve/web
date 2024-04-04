import { test, expect } from '@playwright/test'
import { BASE_URL } from '../consts'

const LOGIN_URL = BASE_URL
const STUDENT_EMAIL = 'student1@upchieve.org'
const STUDENT_PW = 'Password123'
const BAD_CREDENTIALS_ERROR =
  "Oops! That email and password combination doesn't work. Check your password or if you signed up with Google SSO."

test.describe('Username/password login', () => {
  const getFormFields = (page) => {
    const emailInput = page.getByTestId('inputEmail')
    const passwordInput = page.getByTestId('inputPassword')
    const loginButton = page.getByTestId('loginButton')
    const googleSsoButton = page.getByTestId('googleSsoButton')

    return {
      emailInput,
      passwordInput,
      loginButton,
      googleSsoButton,
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL)
  })

  test('Page has the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('UPchieve')
    await expect(page.getByTestId('login-heading')).toBeVisible()
  })

  test('Logging in successfully', async ({ page }) => {
    // Check initial form fields and buttons are present
    const { emailInput, passwordInput, loginButton, googleSsoButton } =
      getFormFields(page)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(loginButton).toBeVisible()
    await expect(googleSsoButton).toBeVisible()

    // Initial focus should be on the email field
    await expect(emailInput).toBeFocused()

    // Check the login buttons are enabled/disabled initially
    await expect(loginButton).not.toBeEnabled()
    await expect(googleSsoButton).toBeEnabled()

    // Fill out the login form => login button to be enabled
    await emailInput.fill(STUDENT_EMAIL)
    await passwordInput.fill(STUDENT_PW)
    await expect(loginButton).toBeEnabled()

    // Un-fill part of the form => login button disabled
    await passwordInput.fill('')
    await expect(loginButton).not.toBeEnabled()

    // Sign in successfully => Navigate to dashboard
    await passwordInput.fill('Password123')
    await expect(loginButton).toBeEnabled()
    await loginButton.click()
    await page.waitForURL('**/dashboard')
    await expect(page.getByTestId('dashboard-banner')).toBeVisible()
  })

  test('Error message appears when incorrect credentials are provided', async ({
    page,
  }) => {
    // Check initial form fields and buttons are present
    const { emailInput, passwordInput, loginButton, googleSsoButton } =
      getFormFields(page)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(loginButton).toBeVisible()
    await expect(googleSsoButton).toBeVisible()

    // Fill in values and submit
    await emailInput.fill(STUDENT_EMAIL)
    await passwordInput.fill('incorrectPassword456')
    await expect(loginButton).toBeEnabled()
    await loginButton.click()

    // Ensure we are still on the same page, and the correct error message is shown
    const error = page.getByTestId('error')
    await expect(error).toBeVisible()
    await expect(error).toHaveText(BAD_CREDENTIALS_ERROR)
  })
})
