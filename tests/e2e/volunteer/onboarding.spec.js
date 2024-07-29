import { test, expect } from '@playwright/test'
import { getClient } from '../db.js'
import {
  createVolunteer,
  loginVolunteer,
  withCertifications,
} from '../utils.js'
import { Login } from '../page-object-models/login.js'
import { TrainingCourse } from '../page-object-models/training-course.js'
import { TrainingQuiz } from '../page-object-models/training-quiz.js'
import { VolunteerDashboard } from '../page-object-models/volunteer-dashboard'
import { BackgroundInformation } from '../page-object-models/background-information'
import path from "path";

test.describe('Volunteer onboarding', () => {
  let dbClient

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

test.describe('UPchieve 101', async () => {
  test.beforeEach(async ({ page }) => {
    // Create and sign-in the volunteer.
    const volunteerUser = await createVolunteer(dbClient, {}, {
      onboarded: false,
      passedUpchieve101: false,
      approved: false,
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

    test('volunteer passes quiz', async ({page}) => {
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

  test.describe('Safety screening', () => {
    let volunteer

    test.beforeAll(async () => {
      volunteer = await createVolunteer(
        dbClient,
        {},
        {
          onboarded: true,
          approved: false,
          passedUpchieve101: true,
        }
      )
    })

    test('Volunteer can complete safety screening steps (background info + proof of identity)', async ({
      browser,
    }) => {
      // From the dashboard, navigate to the Background Information form
      const { volunteerPage } = await loginVolunteer(browser, volunteer)
      const volunteerDashboard = new VolunteerDashboard(volunteerPage)
      await volunteerDashboard.safetyScreeningIsReady()
      const bgInfoPage = await volunteerDashboard.goToBackgroundInformation()
      const backgroundInfo = new BackgroundInformation(bgInfoPage)

      // Fill out and submit the form
      await backgroundInfo.fillOutBackgroundInformation()
      await expect(backgroundInfo.submitButton).toBeEnabled()
      await backgroundInfo.submitButton.click()
      await backgroundInfo.backgroundInformationFormIsComplete()

      // Check that Background Information is marked complete on the dashboard
      await volunteerPage.goto('/dashboard')
      await volunteerPage.waitForURL('**/dashboard')
      await expect(
        volunteerPage.getByTestId('Background information')
      ).toContainText('Completed')

      // Make sure that if you navigate back to this page, you see that the form has been submitted already
      await volunteerPage.getByTestId('Background information').click()
      await volunteerPage.waitForURL('**/background-information')
      await expect(volunteerPage.getByTestId('bg-info-complete')).toBeVisible()

      // Complete Proof of Identity
      await volunteerPage.goto('/dashboard')
      await volunteerPage.waitForURL('**/dashboard')
      const testImagePath = path.join(__dirname, 'test-image-confetti.png')
      await volunteerDashboard.openProofOfIdentityModal()
      await volunteerDashboard.selectPhoto(testImagePath)
      await volunteerDashboard.removePhoto()
      await volunteerDashboard.selectPhoto(testImagePath)
      await volunteerDashboard.submitPhoto()
      await volunteerDashboard.photoUploadIsComplete()
    })
  })
})
