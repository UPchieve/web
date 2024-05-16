import { expect } from '@playwright/test'

export class Login {
  page

  constructor(page) {
    this.page = page
    this.emailInput = page.getByTestId('inputEmail')
    this.passwordInput = page.getByTestId('inputPassword')
    this.loginButton = page.getByTestId('loginButton')
    this.googleSsoButton = page.getByTestId('googleSsoButton')
  }

  async goto() {
    await this.page.goto('/login')
    await this.page.waitForURL('**/login')
  }

  async isReady() {
    // Check initial form fields and buttons are present
    await expect(this.emailInput, 'email to be visible').toBeVisible()
    await expect(this.passwordInput, 'password to be visible').toBeVisible()
    await expect(this.loginButton, 'login button to be visible').toBeVisible()
    await expect(
      this.googleSsoButton,
      'google sso button to be visible'
    ).toBeVisible()

    // Initial focus should be on the email field
    await expect(this.emailInput).toBeFocused()

    // Check the login buttons are enabled/disabled initially
    await expect(this.loginButton).not.toBeEnabled()
    await expect(this.googleSsoButton).toBeEnabled()
  }

  async fillFormWith({ email, password }) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async loginWith({ email, password }) {
    await this.fillFormWith({ email, password })
    await this.loginButton.click()
  }

  async hasError(expectedError, nameSuffix) {
    // Ensure we are still on the same page, and the correct error message is shown
    const error = this.page.getByTestId('error')
    await expect(error).toBeVisible()
    await expect(error).toHaveText(expectedError)
    await expect(this.page).toHaveScreenshot('error-message' + nameSuffix + '.png')
  }
}
