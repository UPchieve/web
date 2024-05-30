import { test, expect } from '@playwright/test'
import { getClient } from '../db.js'
import { createVolunteer, withCertifications } from '../utils.js'
import { Login } from '../page-object-models/login.js'
import { TrainingCourse } from '../page-object-models/training-course.js'
import { TrainingQuiz } from '../page-object-models/training-quiz.js'

test.describe('UPchieve 101', async () => {
  test.beforeEach(async ({ page }) => {
    const dbClient = await getClient().connect()
    // Create and sign-in the volunteer.
    const volunteerUser = await createVolunteer(dbClient, {
      hasOnboarded: false,
    })
    // Add a single certification so we don't hit `isAutoFlowUser`.
    await withCertifications(dbClient, {
      userId: volunteerUser.id,
      certificationNames: ['prealgebra'],
    })
    const volunteerLogin = new Login(page)
    await volunteerLogin.goto()
    await volunteerLogin.loginWith(volunteerUser)
    await page.waitForURL('**/dashboard')
  })

  test('the quiz is available once the volunteer completes the material', async ({
    page,
  }) => {
    // Go to UPchieve 101 training page.
    const coursePage = new TrainingCourse(page)
    await coursePage.goTo('upchieve101')

    await expect(page.getByTestId('course-name')).toBeVisible()
    await expect(page.getByTestId('course-description')).toBeVisible()

    const quizLinkStatus = page.getByTestId('quiz-link-status')
    await expect(quizLinkStatus).toHaveText('Locked')

    await coursePage.completeCourse()

    await expect(quizLinkStatus).toHaveText('Not started')
  })

  test('volunteer passes quiz', async ({ page }) => {
    // Got to UPchieve 101 quiz page.
    const quizPage = new TrainingQuiz(page)
    await quizPage.goTo('upchieve101')
    await quizPage.startQuiz()

    await quizPage.completeQuiz(true)
    await quizPage.expectCongratMessage()
  })

  test('volunteer can retake the quiz if they fail', async ({ page }) => {
    // Got to UPchieve 101 quiz page.
    const quizPage = new TrainingQuiz(page)
    await quizPage.goTo('upchieve101')
    await quizPage.startQuiz()

    await quizPage.completeQuiz(false)
    quizPage.expectFailedMessage()

    await quizPage.reviewAnswers()
    await quizPage.retakeQuiz()
    await quizPage.startQuiz()

    await quizPage.completeQuiz(true)
    await quizPage.expectCongratMessage()
  })
})
