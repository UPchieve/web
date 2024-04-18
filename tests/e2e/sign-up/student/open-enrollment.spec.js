import { test, expect } from '@playwright/test'
import { BASE_URL } from '../../consts'

const BASE_SIGN_UP_URL = BASE_URL + '/sign-up'

test.describe('Open sign-up index page', () => {
  test('Shows option to sign up as student or volunteer if is not referral', async ({page}) => {
    await page.goto(BASE_SIGN_UP_URL)
    await expect(page).toHaveScreenshot('page-load-non-referral.png')
    const studentCard = page.getByTestId('studentCard')
    const volunteerCard = page.getByTestId('volunteerCard')

    await expect(studentCard).toBeVisible()
    await expect(volunteerCard).toBeVisible()

    await studentCard.click()
    await page.waitForURL('**/sign-up/student/eligibility')

    await page.goto(BASE_SIGN_UP_URL)

    await volunteerCard.click()
    await page.waitForURL('**/sign-up/volunteer/account')
  })

  test('Shows referral page if is referral', async ({page}) => {
    await page.goto(BASE_SIGN_UP_URL + '?referral=A')
    await expect(page).toHaveScreenshot('page-load-referral.png')
  })
})
