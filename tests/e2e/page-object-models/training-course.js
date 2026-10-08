import { expect } from '@playwright/test'

// The counter reads "Question N of M"; match only its numbers.
const counterAt = (question, total) =>
  new RegExp(`^\\D*${question}\\D+${total}\\D*$`)

export class TrainingCourse {
  page

  constructor(page) {
    this.page = page
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true })
    this.submitQuizButton = page.getByRole('button', { name: 'Submit Quiz' })
    this.questionCounter = page.getByTestId('training-quiz-question-counter')
    this.quizPassed = page.getByTestId('training-quiz-passed')
    this.courseFinished = page.getByTestId('training-course-finished')
  }

  async completeCourse({ knowledgeChecks }) {
    // The introduction module has no knowledge check.
    await this.nextButton.click()
    for (let i = 0; i < knowledgeChecks; i++) {
      await this.nextButton.click()
      await this.passKnowledgeCheck()
    }
    await expect(this.courseFinished).toBeVisible()
  }

  // Every seeded training quiz question's correct answer is "A".
  async passKnowledgeCheck() {
    await expect(this.questionCounter).toHaveText(counterAt(1, '\\d+'))
    const [, totalQuestions] = (await this.questionCounter.textContent())
      .match(/\d+/g)
      .map(Number)
    for (let question = 1; question <= totalQuestions; question++) {
      await expect(this.questionCounter).toHaveText(
        counterAt(question, totalQuestions)
      )
      await this.page.getByText('A', { exact: true }).first().click()
      if (question < totalQuestions) await this.nextButton.click()
    }
    await this.submitQuizButton.click()
    await this.quizPassed.getByRole('button', { name: 'Next' }).click()
  }
}
