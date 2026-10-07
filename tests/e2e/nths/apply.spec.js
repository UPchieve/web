import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import { setFeatureFlags } from '../utils.ts'
import { createCoach } from '../nths-utils.ts'
import { Login } from '../page-object-models/login.js'
import { VolunteerDashboard } from '../page-object-models/volunteer-dashboard.js'
import { POSTHOG_FEATURE_FLAGS } from '../../../src/consts'

test.describe('NTHS president application', () => {
  let dbClient

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

  test('a coach with no training or tutored session applies', async ({
    page,
  }) => {
    await setFeatureFlags(page, {
      [POSTHOG_FEATURE_FLAGS.NTHS_APPLICATION_PAGE]: true,
    })
    const coach = await createCoach(dbClient, {
      onboarded: false,
      approved: false,
      passedUpchieve101: false,
    })

    const login = new Login(page)
    const dashboard = new VolunteerDashboard(page)
    await login.goto()
    await login.loginWith(coach)
    await page.waitForURL('**/dashboard')

    if (dashboard.isMobile) await dashboard.mobileMenu.click()
    const nthsLink = page.locator('#nths-group-sidebar-link')
    await expect(nthsLink).toContainText('Apply to NTHS')
    await nthsLink.click()
    await page.waitForURL('**/groups/apply')

    await expect(page.getByTestId('nths-high-school-only')).toBeVisible()
    await page
      .getByRole('link', { name: 'Apply to Become a President' })
      .click()
    await page.waitForURL('**/groups/apply/form')

    const schoolInput = page.locator('input#school')
    await schoolInput.fill('Approved')
    await page
      .getByText('Approved School (Denver, CO)', { exact: true })
      .click()
    await page.getByTestId('nths-grade-select').click()
    // ion-select renders its options in an overlay, so pick by role.
    await page.getByRole('radio', { name: '10th grade' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('radio', { name: '10th grade' })).toBeHidden()
    await page.getByRole('button', { name: 'Continue' }).click()

    // CI loads reCAPTCHA, which adds a hidden g-recaptcha-response textarea.
    for (const answer of await page.locator('textarea:visible').all()) {
      await answer.fill('I want to help students at my school.')
    }
    for (const commitment of await page.getByRole('checkbox').all()) {
      await commitment.check()
    }
    await page.getByRole('button', { name: 'Submit application' }).click()
    await page.waitForURL('**/groups/application-pending')
  })
})
