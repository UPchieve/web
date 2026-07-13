import { test } from '@playwright/test'
import { getClient } from '../db.ts'
import { createVolunteer } from '../utils.ts'
import { VolunteerTraining } from '../page-object-models/volunteer-training.js'
import { Login } from '../page-object-models/login'

let dbClient

test.describe('Training', async () => {
  let volunteerUser

  test.beforeEach(async () => {
    dbClient = await getClient().connect()
    volunteerUser = await createVolunteer(dbClient)
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

  async function loginVolunteer(page) {
    const volunteerLogin = new Login(page)
    await volunteerLogin.goto()
    await volunteerLogin.loginWith({
      email: volunteerUser.email,
      password: volunteerUser.password,
    })
    await page.waitForURL('**/dashboard')
  }

  test('pass prealgebra quiz', async ({ page }) => {
    await loginVolunteer(page)

    /* Volunteer pages */
    const volunteerTraining = new VolunteerTraining(page)

    /* Go to training - already authenticated! */
    await page.goto('/training')
    await page.waitForURL('**/training')
    await volunteerTraining.hasText('Volunteer Training and Certifications')
    await volunteerTraining.checkSubjectCerts()

    /* Start prealgebra quiz */
    await volunteerTraining.chooseSubject('prealgebra')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.startQuiz()

    /*Go through all questions*/
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.hasText('Question 1')

    await volunteerTraining.completeQuiz('pass')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.checkResults('You passed!')
  })

  test('fail prealgebra quiz, review answers, retake quiz', async ({
    page,
  }) => {
    await loginVolunteer(page)

    /* Volunteer pages */
    const volunteerTraining = new VolunteerTraining(page)

    /* Go to training - already authenticated! */
    await page.goto('/training')
    await page.waitForURL('**/training')
    await volunteerTraining.hasText('Volunteer Training and Certifications')
    await volunteerTraining.checkSubjectCerts()

    /* Start prealgebra quiz */
    await volunteerTraining.chooseSubject('prealgebra')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.startQuiz()

    /*Go through all questions*/
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.hasText('Question 1')

    /**Fail quiz */
    await volunteerTraining.completeQuiz('fail')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.checkResults('You failed')

    /**Review answers and retake quiz */
    await volunteerTraining.reviewAnswers()
    await volunteerTraining.retakeQuiz()
    await volunteerTraining.startQuiz()
  })

  test('fail prealgebra quiz, review answers, review concepts, retake quiz', async ({
    page,
  }) => {
    await loginVolunteer(page)

    /* Volunteer pages */
    const volunteerTraining = new VolunteerTraining(page)

    /* Go to training - already authenticated! */
    await page.goto('/training')
    await page.waitForURL('**/training')
    await volunteerTraining.hasText('Volunteer Training and Certifications')
    await volunteerTraining.checkSubjectCerts()

    /* Start prealgebra quiz */
    await volunteerTraining.chooseSubject('prealgebra')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.startQuiz()

    /*Go through all questions*/
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.hasText('Question 1')

    /**Fail quiz */
    await volunteerTraining.completeQuiz('fail')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.checkResults('You failed')

    /**Review answers and review concepts quiz */
    await volunteerTraining.reviewAnswers()
    await volunteerTraining.reviewConcepts()
    await volunteerTraining.startQuizFromReview()
    await volunteerTraining.startQuiz()
  })
})
