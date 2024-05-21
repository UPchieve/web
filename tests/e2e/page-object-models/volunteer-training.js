import { expect } from '@playwright/test'

export class VolunteerTraining {
  page

  constructor(page) {
    this.page = page
    this.subjectCertifications = this.page.getByTestId('subject-certifications')
    this.startQuizBtn = this.page.getByRole('button', { name: 'Start Quiz' })
    this.submitQuiz = this.page.getByTestId('submit-quiz')
    this.quizQuestions = this.page.getByTestId('quiz-questions')
    this.nextQuestion = this.page.getByTestId('next-question')
    this.quizResultsHeader = this.page.getByTestId('quiz-results-header')
    this.reviewAnswersBtn = this.page.getByRole('button', {
      name: 'Review Answers',
    })
    this.reviewConceptsBtn = this.page.getByRole('button', {
      name: 'Review Concepts',
    })
    this.reviewMaterialsHeader = this.page.getByTestId(
      'review-materials-header'
    )
    this.retakeQuizBtn = this.page.getByRole('button', { name: 'Retake Quiz' })
  }

  async hasText(message) {
    await expect(
      this.page.getByText(message),
      'has correct text'
    ).toBeVisible()
  }
  
  async checkSubjectCerts() {
    await expect(this.subjectCertifications).toBeVisible() 
  }

  async chooseSubject(subject) {
    await this.subjectCertifications.click()
    await expect(this.page.getByTestId(`cert-${subject}`)).toBeVisible()
    await this.page.getByTestId(`start-quiz-btn-${subject}`).click()
  }

  async startQuiz() {
    await expect(this.startQuizBtn).toBeVisible()
    await this.startQuizBtn.click()
    await expect(this.quizQuestions).toBeVisible()
  }

  async completeQuiz(passOrFail) {
    const answer = passOrFail === 'pass' ? 'a. A' : 'b. B'
    while (!(await this.submitQuiz.isVisible())) {
      await this.page.getByLabel(answer).check()
      await this.nextQuestion.click()
    }
    await expect(this.submitQuiz).toBeVisible()
    await this.page.getByLabel(answer).check()
    await this.submitQuiz.click()
  }

  async checkResults(results){
    await expect(this.quizResultsHeader).toContainText(results)
  }

  async reviewAnswers(){
    await expect(this.reviewAnswersBtn).toBeVisible()
    await expect(this.reviewConceptsBtn).toBeVisible()
    await this.reviewAnswersBtn.click()
  }

  async reviewConcepts(){
    await expect(this.reviewConceptsBtn).toBeVisible()
    await this.reviewConceptsBtn.click()
    await expect(this.reviewMaterialsHeader).toBeVisible()
  }

  async startQuizFromReview(){
    await expect(this.startQuizBtn).toBeVisible()
    await this.startQuizBtn.click()
  }

  async retakeQuiz(){
    await expect(this.retakeQuizBtn).toBeVisible()
    await this.retakeQuizBtn.click()
  }
}
