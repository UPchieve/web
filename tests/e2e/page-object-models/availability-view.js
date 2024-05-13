import { expect } from '@playwright/test'

export class AvailabilityView {
  page

  constructor(page) {
    this.page = page
    this.timezoneSelector = page.getByTestId('tz-selector')
    this.saveAvailbilityButton = page.getByTestId('save-availability-button')
  }

  async goto() {
    await this.page.goto('/calendar')
    await this.page.waitForURL('**/calendar')
  }

  async selectTimezone(timezone) {
    await this.timezoneSelector.selectOption(timezone)
    await expect(this.timezoneSelector).toHaveValue(timezone)
  }

  async selectTimeSlot(day, hour) {
    const timeSlot = await this.page.getByTestId(`${day}-${hour}`)
    await timeSlot.click()
    await this.isTimeSlotSelected(timeSlot)
  }

  async isTimeSlotSelected(element) {
    await expect(element).toHaveCSS('background-color', 'rgb(138, 232, 212)')
  }

  async saveAvailability(timezone, availability) {
    await this.saveAvailbilityButton.click()
    await this.page.reload()
    await expect(this.timezoneSelector).toHaveValue(timezone)
    await this.checkAvailability(availability)
  }

  async checkAvailability(availability) {
    for (const [day, hours] of Object.entries(availability)) {
      for (const hour of hours) {
        const timeSlot = await this.page.getByTestId(`${day}-${hour}`)
        await this.isTimeSlotSelected(timeSlot)
      }
    }
  }
}
