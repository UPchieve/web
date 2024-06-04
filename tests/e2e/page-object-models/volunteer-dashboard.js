import { expect } from '@playwright/test'

export class VolunteerDashboard {
  page

  constructor(page) {
    this.page = page
    this.mobileMenu = page.getByTestId('mobile-header-hamburger')

    // Volunteer onboarding
    // Upchieve 101
    this.trainingLink = page.getByText('Training')

    // Safety screening
    this.safetyScreening = page.getByTestId('safety-screening')
    this.backgroundInformationAccountAction = page.getByTestId(
      'Background information'
    )
    this.proofOfIdentityAccountAction = page.getByTestId('Proof of identity')

  }

  get isMobile() {
    return this.page.viewportSize().width < 767
  }

  async joinSessionFor(firstName) {
    await expect(
      this.page.getByTestId(`session-row-${firstName}`),
      'the new student session should show up for the volunteer'
    ).toBeVisible()
    await this.page.getByTestId(`session-row-${firstName}`).click()
    await this.page.waitForURL('**/session/**')
  }

  async goToTraining() {
    if (this.isMobile) {
      await this.mobileMenu.click()
    }

    await this.trainingLink.click()
  }

  async safetyScreeningIsReady() {
    await expect(this.safetyScreening).toBeVisible()
    await expect(this.backgroundInformationAccountAction).toBeVisible()
    await expect(this.proofOfIdentityAccountAction).toBeVisible()
  }

  async goToBackgroundInformation() {
    await this.backgroundInformationAccountAction.click()
    await this.page.waitForURL('**/background-information')

    return this.page
  }
}
