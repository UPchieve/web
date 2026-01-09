import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import { createVolunteer, logInUserViaAPI } from '../utils.ts'
import { VolunteerTraining } from '../page-object-models/volunteer-training.js'
import path from 'path'

let dbClient
const authFile = path.join(
  __dirname,
  '../../../playwright/.auth/volunteer.json'
)

test.describe('Training', async () => {
  let volunteerUser

  test.beforeAll(async ({ browser }) => {
    dbClient = await getClient().connect()
    volunteerUser = await createVolunteer(dbClient)

    await logInUserViaAPI(browser, volunteerUser, authFile)
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

  test.use({ storageState: authFile })

  test.skip('pass prealgebra quiz', async ({ page }) => {
    /* Volunteer pages */
    const volunteerTraining = new VolunteerTraining(page)

    /* Go to training - already authenticated! */
    await page.goto('/training')
    await page.waitForURL('**/training')
    await volunteerTraining.hasText('Volunteer Training and Certifications')
    await expect(page).toHaveScreenshot('volunteer-training-and-certs.png')
    await volunteerTraining.checkSubjectCerts()

    /* Start prealgebra quiz */
    await volunteerTraining.chooseSubject('prealgebra')
    await page.waitForURL('**/training/prealgebra/quiz')
    await expect(page).toHaveScreenshot('prealgebra-certification-quiz.png')
    await volunteerTraining.startQuiz()

    /*Go through all questions*/
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.hasText('Question 1')
    await expect(page).toHaveScreenshot('prealgebra-quiz-question1.png')

    await volunteerTraining.completeQuiz('pass')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.checkResults('You passed!')
    await expect(page).toHaveScreenshot('prealgebra-quiz-pass.png')
  })

  test.skip('fail prealgebra quiz, review answers, retake quiz', async ({
    page,
  }) => {
    /* Volunteer pages */
    const volunteerTraining = new VolunteerTraining(page)

    /* Go to training - already authenticated! */
    await page.goto('/training')
    await page.waitForURL('**/training')
    await volunteerTraining.hasText('Volunteer Training and Certifications')
    await expect(page).toHaveScreenshot('volunteer-training-and-certs.png')
    await volunteerTraining.checkSubjectCerts()

    /* Start prealgebra quiz */
    await volunteerTraining.chooseSubject('prealgebra')
    await page.waitForURL('**/training/prealgebra/quiz')
    await expect(page).toHaveScreenshot('prealgebra-certification-quiz.png')
    await volunteerTraining.startQuiz()

    /*Go through all questions*/
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.hasText('Question 1')
    await expect(page).toHaveScreenshot('prealgebra-quiz-question1.png')

    /**Fail quiz */
    await volunteerTraining.completeQuiz('fail')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.checkResults('You failed')
    await expect(page).toHaveScreenshot('prealgebra-quiz-fail.png')

    /**Review answers and retake quiz */
    await volunteerTraining.reviewAnswers()
    await expect(page).toHaveScreenshot('prealgebra-quiz-review-answers.png')
    await volunteerTraining.retakeQuiz()
    await expect(page).toHaveScreenshot('prealgebra-certification-quiz.png')
    await volunteerTraining.startQuiz()
  })

  test.skip('fail prealgebra quiz, review answers, review concepts, retake quiz', async ({
    page,
  }) => {
    /* Volunteer pages */
    const volunteerTraining = new VolunteerTraining(page)

    /* Go to training - already authenticated! */
    await page.goto('/training')
    await page.waitForURL('**/training')
    await volunteerTraining.hasText('Volunteer Training and Certifications')
    await expect(page).toHaveScreenshot('volunteer-training-and-certs.png')
    await volunteerTraining.checkSubjectCerts()

    /* Start prealgebra quiz */
    await volunteerTraining.chooseSubject('prealgebra')
    await page.waitForURL('**/training/prealgebra/quiz')
    await expect(page).toHaveScreenshot('prealgebra-certification-quiz.png')
    await volunteerTraining.startQuiz()

    /*Go through all questions*/
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.hasText('Question 1')
    await expect(page).toHaveScreenshot('prealgebra-quiz-question1.png')

    /**Fail quiz */
    await volunteerTraining.completeQuiz('fail')
    await page.waitForURL('**/training/prealgebra/quiz')
    await volunteerTraining.checkResults('You failed')
    await expect(page).toHaveScreenshot('prealgebra-quiz-fail.png')

    /**Review answers and review concepts quiz */
    await volunteerTraining.reviewAnswers()
    await expect(page).toHaveScreenshot('prealgebra-quiz-review-answers.png')
    await volunteerTraining.reviewConcepts()
    await expect(page).toHaveScreenshot('prealgebra-quiz-review-materials.png')
    await volunteerTraining.startQuizFromReview()
    await volunteerTraining.startQuiz()
  })
})
