import { faker } from '@faker-js/faker'
import { test, expect } from '@playwright/test'

const BASE_SIGN_UP_URL = '/sign-up'

test.describe('Open sign-up index page', () => {
  test.skip('Shows option to sign up as student or volunteer if is not referral', async ({
    page,
  }) => {
    await page.goto(BASE_SIGN_UP_URL)
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

  test('Shows referral page if is referral', async ({ page }) => {
    await page.goto(BASE_SIGN_UP_URL + '?referral=A')
  })
})

test.describe('[OLD DESIGN]', async () => {
  function getFormFields(page) {
    return {
      gradeInput: page.getByTestId('student-grade-select'),
      schoolInput: page.getByTestId('student-school-autocomplete'),
      zipInput: page.getByTestId('student-zipcode-input'),
      studentEmailInput: page.getByTestId('student-email-input'),
      studentFirstNameInput: page.getByTestId('student-first-name-input'),
      studentLastNameInput: page.getByTestId('student-last-name-input'),
      passwordInput: page.getByTestId('student-password-input'),
      parentGuardianEmailInput: page.getByTestId('parent-guardian-email-input'),
      pgStudentFirstNameInput: page.getByTestId('pg-student-first-name-input'),
      pgStudentLastNameInput: page.getByTestId('pg-student-last-name-input'),
    }
  }

  test.skip('open student', async ({ page }) => {
    await page.goto(BASE_SIGN_UP_URL + '/student/eligibility')

    const {
      gradeInput,
      schoolInput,
      zipInput,
      studentEmailInput,
      studentFirstNameInput,
      studentLastNameInput,
      passwordInput,
    } = getFormFields(page)

    await gradeInput.click()
    await page.getByText('8th grade').click()
    await schoolInput.click()
    await schoolInput.fill('Approved School')
    await page.getByText(/Approved School*/).click()
    await zipInput.fill('00000')
    await studentEmailInput.fill(faker.internet.email())

    await page.getByTestId('eligibility-form-submit-btn').click()
    await page.waitForURL('**/sign-up/student/eligible')

    await page.getByText('Continue').click()
    await page.waitForURL('**/sign-up/student/account')

    await studentFirstNameInput.fill(faker.person.firstName())
    await studentLastNameInput.fill(faker.person.lastName())
    await passwordInput.fill('Password123')
    await page.getByText('Create my account').click()
    await page.waitForURL('**/verify')
  })

  test.skip('partner student', async ({ page }) => {
    await page.goto(
      BASE_SIGN_UP_URL + '/student/eligibility?partner=college-mentors'
    )

    const { gradeInput, schoolInput, zipInput, studentEmailInput } =
      getFormFields(page)

    await gradeInput.click()
    await page.getByText('10th grade').click()
    await schoolInput.click()
    await schoolInput.fill('Unapproved School')
    await page.getByText(/Unapproved School*/).click()
    await zipInput.fill('00000')
    await studentEmailInput.fill('partnerstudenteligibility@e2etest.com')

    await page.getByTestId('eligibility-form-submit-btn').click()
    await page.waitForURL('**/sign-up/student/eligible')
  })

  test.skip('parent/guardian', async ({ page }) => {
    await page.goto(
      BASE_SIGN_UP_URL + '/student/eligibility?parent&partner=college-mentors'
    )

    const {
      gradeInput,
      schoolInput,
      zipInput,
      studentEmailInput,
      parentGuardianEmailInput,
      pgStudentFirstNameInput,
      pgStudentLastNameInput,
    } = getFormFields(page)

    await pgStudentFirstNameInput.fill(faker.person.firstName())
    await pgStudentLastNameInput.fill(faker.person.lastName())
    await gradeInput.click()
    await page.getByText('7th grade').click()
    await schoolInput.click()
    await schoolInput.fill('Another Approved')
    await page.getByText(/Another Approved*/).click()
    await zipInput.fill('00000')
    await studentEmailInput.fill(faker.internet.email())
    await parentGuardianEmailInput.fill(faker.internet.email())

    await page.getByTestId('eligibility-form-submit-btn').click()
    await page.waitForSelector('#pg-confirmation-message')
  })
})
