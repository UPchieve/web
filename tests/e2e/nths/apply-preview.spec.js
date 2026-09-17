import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import { setFeatureFlags } from '../utils.ts'
import { createHighSchoolCoach, createTutoredSession } from '../nths-utils.ts'
import { Login } from '../page-object-models/login.js'
import { VolunteerDashboard } from '../page-object-models/volunteer-dashboard.js'
import { POSTHOG_FEATURE_FLAGS } from '../../../src/consts'

test.describe('NTHS apply preview', () => {
  let dbClient

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

  test('a coach who becomes eligible while signed in finds the live application at their NTHS link', async ({
    page,
  }) => {
    await setFeatureFlags(page, {
      [POSTHOG_FEATURE_FLAGS.NTHS_APPLICATION_PAGE]: true,
    })

    const coach = await createHighSchoolCoach(dbClient)

    const login = new Login(page)
    const dashboard = new VolunteerDashboard(page)
    await login.goto()
    await login.loginWith(coach)
    await page.waitForURL('**/dashboard')

    await dashboard.clickSidebarLink('#nths-group-sidebar-link')
    await page.waitForURL('**/groups/apply-preview')
    await expect(page.getByTestId('nths-apply-preview')).toBeVisible()

    await createTutoredSession(dbClient, { volunteerId: coach.id })

    await dashboard.clickSidebarLink('#dashboard-sidebar-link')
    await page.waitForURL('**/dashboard')
    await dashboard.clickSidebarLink('#nths-group-sidebar-link')
    await page.waitForURL('**/groups/apply')
  })
})
