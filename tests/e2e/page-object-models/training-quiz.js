import { expect } from '@playwright/test'

export class TrainingQuiz {
  constructor(page) {
    this.page = page
    this.submitBtnTestId = 'btn-submit-quiz'
    this.nextBtnTestId = 'btn-question-next'
  }

  async goTo(quiz) {
    this.page.goto('/training/' + quiz + '/quiz')
    await this.page.waitForURL('**/quiz')
  }

  async startQuiz() {
    await this.page.getByTestId('btn-start-quiz').click()
    expect(this.page.getByText('Question 1')).toBeVisible()
  }

  async completeQuiz(chooseCorrectAnswer) {
    do {
      if (chooseCorrectAnswer) {
        await this.selectCorrectAnswer()
      } else {
        await this.selectWrongAnswer()
      }

      if (await this.hasNextButton()) {
        this.goNext()
      }
    } while (!(await this.hasSubmitButton()))

    await this.submit()
  }

  async selectCorrectAnswer() {
    await this.page.getByTestId('a').click()
  }

  async selectWrongAnswer() {
    await this.page.getByTestId('d').click()
  }

  async submit() {
    await this.page.getByTestId(this.submitBtnTestId).click()
  }

  async goNext() {
    await this.page.getByTestId(this.nextBtnTestId).click()
  }

  async reviewAnswers() {
    await this.page.getByText('Review answers').click()
  }

  async retakeQuiz() {
    await this.page.getByText('Retake quiz').click()
  }

  async hasSubmitButton() {
    return this.page.getByTestId(this.submitBtnTestId).isVisible()
  }

  async hasNextButton() {
    return this.page.getByTestId(this.nextBtnTestId).isVisible()
  }

  async expectCongratMessage() {
    await this.page.waitForSelector('#title-quiz-result')
    await expect(
      this.page.getByText('What a rockstar! You passed!')
    ).toBeVisible()
  }

  async expectFailedMessage() {
    await this.page.waitForSelector('#title-quiz-result')
    await expect(
      this.page.getByText("You failed this time, but don't give up!")
    ).toBeVisible()
  }
}
