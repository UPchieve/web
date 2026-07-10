import { expect } from '@playwright/test'

export class BackgroundInformation {
  page

  constructor(page) {
    this.page = page
    this.backgroundInformationFormSelectors = {
      // @TODO Depending on the option chosen, we may render a follow up question
      // i.e. for graduate student
      iAmCurrentlyQuestion: {
        questionSelector: page.getByTestId('question-i-am-currently'),
        answerUnemployed: page.getByTestId('Unemployed'),
        answerCaregiver: page.getByTestId('Caregiver'),
      },
      linkedInQuestion: {
        questionSelector: page.getByTestId('question-linkedin-profile'),
        answerInput: page.getByTestId('linked-in-input'),
      },
      whereDoYouLiveQuestion: {
        questionSelector: page.getByTestId('question-where-do-you-live'),
        selectSelector: page.getByTestId('location-input'),
        stateSelector: page.getByTestId('state-select'),
        cityInput: page.getByTestId('city-input'),
      },
    }

    this.submitButton = page.getByTestId('submit-bg-info')
    this.completedMessage = page.getByTestId('bg-info-complete')
  }

  async fillOutBackgroundInformation() {
    await expect(
      this.page.getByTestId('background-information-header')
    ).toBeVisible()
    await expect(
      this.page.getByTestId('background-information-explainer')
    ).toBeVisible()
    const iAmCurrentlyQuestion =
      this.backgroundInformationFormSelectors.iAmCurrentlyQuestion
    await expect(iAmCurrentlyQuestion.questionSelector).toBeVisible()
    // User may check multiple
    await iAmCurrentlyQuestion.answerUnemployed.check()
    await iAmCurrentlyQuestion.answerCaregiver.check()

    const linkedInQuestion =
      this.backgroundInformationFormSelectors.linkedInQuestion
    await expect(linkedInQuestion.questionSelector).toBeVisible()
    await linkedInQuestion.answerInput.fill(
      'https://www.linkedin.com/in/testUser'
    )

    const whereDoYouLiveQuestion =
      this.backgroundInformationFormSelectors.whereDoYouLiveQuestion
    await expect(whereDoYouLiveQuestion.questionSelector).toBeVisible()
    await whereDoYouLiveQuestion.selectSelector.click()
    await whereDoYouLiveQuestion.selectSelector
      .getByText('United States of America')
      .click()
    await whereDoYouLiveQuestion.stateSelector.click()
    await whereDoYouLiveQuestion.stateSelector.getByText('Connecticut').click()
    await whereDoYouLiveQuestion.cityInput.fill('Hartford')
  }

  async backgroundInformationFormIsComplete() {
    // Only the completed message is visible
    await this.page.waitForURL('**/background-information')
    await expect(this.completedMessage).toBeVisible()
    const questions = [
      this.backgroundInformationFormSelectors.iAmCurrentlyQuestion
        .questionSelector,
      this.backgroundInformationFormSelectors.linkedInQuestion.questionSelector,
      this.backgroundInformationFormSelectors.whereDoYouLiveQuestion
        .questionSelector,
      this.backgroundInformationFormSelectors.languagesQuestion
        .questionSelector,
    ]
    questions.forEach(async (selector) => {
      await expect(selector).not.toBeVisible()
    })
  }
}
