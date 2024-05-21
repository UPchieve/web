import { expect } from '@playwright/test'

export class VolunteerDashboard {
  page

  constructor(page) {
    this.page = page
    this.trainingLink = page.getByText('Training')
    this.mobileMenu = page.getByTestId('mobile-header-hamburger')
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
}
