import { expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

export class VolunteerPartnerSignup {
  page

  constructor(page) {
    this.page = page

    // Step 1: Email and password
    this.emailInput = page.getByTestId('vp-signup-email')
    this.passwordInput = page.getByTestId('vp-signup-password')
    this.step1ContinueButton = page.getByTestId('vp-signup-step1-continue-btn')
    this.signupErrors = page.getByTestId('vp-signup-errors')
    this.step1Title = page.getByTestId('vp-signup-title')

    // Step 2: Name, phone number, user agreement checkbox
    this.step2Title = page.getByTestId('vp-signup-step-2-title')
    this.firstName = page.getByTestId('vp-signup-first-name')
    this.lastName = page.getByTestId('vp-signup-last-name')
    this.phoneNumber = page.getByLabel('Example: (201) 555-0123')
    this.userAgreementCheckbox = page.getByTestId('vp-signup-user-agreement')
    this.step2SignupButton = page.getByTestId('vp-signup-complete-button')
  }

  async step1IsReady(partnerOrgName) {
    // Step 1: Filling out username/password
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.step1ContinueButton).toBeVisible()
    await expect(this.step1Title).toBeVisible()
    await expect(this.step1Title).toHaveText(`Welcome ${partnerOrgName} Volunteer!`)
  }

  async completeStep1(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.step1ContinueButton.click()
  }

  async step2IsReady() {
    await expect(this.step2Title).toBeVisible()
    await expect(this.firstName).toBeVisible()
    await expect(this.lastName).toBeVisible()
    await expect(this.phoneNumber).toBeVisible()
    await expect(this.userAgreementCheckbox).toBeVisible()
    await expect(this.step2SignupButton).toBeVisible()
  }

  async completeStep2() {
    await this.firstName.fill(faker.person.firstName())
    await this.lastName.fill(faker.person.lastName())
    await this.phoneNumber.fill(
      '406' + // a known valid area code
      faker.string.numeric({
        length: 7,
        allowLeadingZeros: false,
    }))
    await this.userAgreementCheckbox.check()
    await this.step2SignupButton.click()
    await this.page.waitForURL('**/verify')
  }
}


