import { expect } from '@playwright/test'

export class VolunteerDashboard {
  page

  constructor(page) {
    this.page = page
  }

  async joinSessionFor(firstName) {
    await expect(
      this.page.getByTestId(`session-row-${firstName}`),
      'the new student session should show up for the volunteer'
    ).toBeVisible()
    await this.page.getByTestId(`session-row-${firstName}`).click()
  }
}
