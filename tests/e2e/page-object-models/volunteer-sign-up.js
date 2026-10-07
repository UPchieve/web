import { expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

export class VolunteerSignUp {
  page

  constructor(page) {
    this.page = page

    this.heading = page.getByRole('heading', { level: 1 })
    this.emailInput = page.getByLabel('Email', { exact: true })
    this.passwordInput = page.getByLabel('Password', { exact: true })
    this.continueButton = page.getByRole('button', {
      name: 'Continue',
      exact: true,
    })

    this.firstNameInput = page.getByLabel('First Name', { exact: true })
    this.lastNameInput = page.getByLabel('Last Name', { exact: true })
    this.phoneInput = page.getByLabel('Phone number', { exact: true })
    this.signUpButton = page.getByRole('button', {
      name: 'Sign Up',
      exact: true,
    })
  }

  async gotoPartnerLink(partnerKey) {
    await this.page.goto(`/signup/volunteer/${partnerKey}`)
  }

  async accountStepIsReadyFor(partnerName) {
    await expect(this.heading).toHaveText(`Welcome ${partnerName} Volunteer!`)
  }

  async completeAccountStep(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await expect(this.continueButton).toBeEnabled()
    await this.continueButton.click()
    await this.page.waitForURL('**/sign-up/volunteer/about')
  }

  async completeAboutStep() {
    await this.firstNameInput.fill(faker.person.firstName())
    await this.lastNameInput.fill(faker.person.lastName())
    await this.phoneInput.fill(
      '406' + // libphonenumber rejects a US exchange starting with 0 or 1
        faker.string.numeric({ length: 1, exclude: ['0', '1'] }) +
        faker.string.numeric(6)
    )
    await expect(this.signUpButton).toBeEnabled()
    await this.signUpButton.click()
    await this.page.waitForURL('**/verify')
  }
}
