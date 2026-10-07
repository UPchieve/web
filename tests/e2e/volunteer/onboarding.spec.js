import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import { createVolunteer, loginVolunteer } from '../utils.ts'
import { VolunteerDashboard } from '../page-object-models/volunteer-dashboard'
import { BackgroundInformation } from '../page-object-models/background-information'
import path from 'path'

test.describe('Volunteer onboarding', () => {
  let dbClient

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
  })

  test.afterAll(async () => {
    await dbClient.release()
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
      await volunteerPage.route(
        '**/user/volunteer-approval/photo',
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              imageUrl: 'https://example.com/test-photo.png',
            }),
          })
        }
      )
      const volunteerDashboard = new VolunteerDashboard(volunteerPage)
      await volunteerDashboard.safetyScreeningIsReady()
      const bgInfoPage = await volunteerDashboard.goToBackgroundInformation()
      const backgroundInfo = new BackgroundInformation(bgInfoPage)

      // Fill out and submit the form
      await backgroundInfo.fillOutBackgroundInformation()
      await expect(backgroundInfo.submitButton).toBeEnabled()
      await backgroundInfo.submitButton.click()

      // Check that Background Information is marked complete on the dashboard
      await volunteerPage.goto('/dashboard')
      await volunteerPage.waitForURL('**/dashboard')
      await expect(
        volunteerPage.getByTestId('Background information-container')
      ).toContainText('Completed')

      // Make sure that if you navigate back to this page, you see that the form has been submitted already
      await volunteerPage.getByTestId('Background information').click()
      await volunteerPage.waitForURL('**/background-information')
      await expect(volunteerPage.getByTestId('bg-info-complete')).toBeVisible()
      await volunteerPage.getByTestId('bg-info-complete-button').click()

      // Complete Proof of Identity
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
