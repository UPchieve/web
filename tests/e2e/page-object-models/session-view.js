import { expect } from '@playwright/test'

export class SessionView {
  page

  constructor(page) {
    this.page = page
  }

  async sendMessage(message) {
    await this.page.getByTestId('chat-textarea').fill(message)
    await this.page.keyboard.press('Enter')
    await this.hasMessage(message)
  }

  async hasMessage(message) {
    await expect(
      this.page.getByText(message),
      'message was sent successfully'
    ).toBeVisible()
  }
}
