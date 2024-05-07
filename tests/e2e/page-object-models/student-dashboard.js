import { expect } from '@playwright/test'

export class StudentDashboard {
  page

  constructor(page) {
    this.page = page
  }

  get isMobile() {
    return this.page.viewportSize().width < 767
  }

  async createSessionFor({ subject, topic }) {
    const card = await this.page.getByTestId(`${subject}-subject-card`)
    if (!this.isMobile) {
      await card.getByTestId('dropdown-select').selectOption(topic)
    }

    await card.getByTestId('start-chat').click()

    if (this.isMobile) {
      await this.page.getByTestId(`start-session-${topic}`).click()
    }

    await this.page
      .getByTestId('survey-question-Solve a specific question')
      .click()
    await this.page.getByTestId('presession-next-button').click()
    await this.page.getByTestId('survey-question-Not at all').click()
    await this.page.getByTestId('presession-next-button').click()
    await this.page.getByTestId('survey-question-Confident').click()
    await this.page.getByTestId('presession-submit').click()

    await this.page.waitForURL(`**/session/${subject}/${topic}`)
    await expect(
      this.page.getByTestId('cancel-session-button'),
      'should be in session without a partner'
    ).toBeVisible()
  }
}
