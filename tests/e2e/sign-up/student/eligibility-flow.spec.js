import { faker } from '@faker-js/faker'
import { test, expect } from '@playwright/test'

const BASE_SIGN_UP_URL = '/sign-up'

test.describe('Open sign-up index page', () => {
  test('Shows option to sign up as student or volunteer if is not referral', async ({
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
      gradeInput: {
        selectGradeLevel: async (gradeLevel) => {
          await page.getByTestId('student-grade-select').click()
          // workaround for ion-select; `getByText()` won't work because of how ion overlays elements / it's not "visible"
          await page.getByRole('radio', { name: gradeLevel }).click()
          // There is something strange about the <ion-select>'s implementation where it prevents
          // future elements the browser interacts with from getting/keeping focus.
          // For the tests, manually trigger ion to blur.
          await page.keyboard.press('Escape')
          await page.waitForTimeout(100)
        },
      },
      schoolInput: page.getByTestId('student-school-autocomplete'),
      zipInput: page.getByTestId('student-zipcode-input'),
      studentEmailInput: page.getByTestId('student-email-input'),
      studentFirstNameInput: page.getByTestId('student-first-name-input'),
      studentLastNameInput: page.getByTestId('student-last-name-input'),
      passwordInput: page.getByTestId('student-password-input'),
      parentGuardianEmailInput: page.getByTestId('parent-guardian-email-input'),
      pgStudentFirstNameInput: page.getByTestId('pg-student-first-name-input'),
      pgStudentLastNameInput: page.getByTestId('pg-student-last-name-input'),
      createAccountButton: page.getByTestId('create-account-btn'),
    }
  }

  test('open student', async ({ page }) => {
    await page.goto(BASE_SIGN_UP_URL + '/student/eligibility')

    const {
      gradeInput,
      schoolInput,
      zipInput,
      studentEmailInput,
      studentFirstNameInput,
      studentLastNameInput,
      passwordInput,
      createAccountButton,
    } = getFormFields(page)

    await schoolInput.click()
    await schoolInput.fill('Approved')
    await expect(schoolInput).toBeFocused()
    await page
      .getByText('Approved School (Denver, CO)', { exact: true })
      .click()
    await zipInput.click()
    await zipInput.fill('00000')
    await studentEmailInput.fill(faker.internet.email())
    // For some reason, the grade input prevents other elements from maintaining focus in Playwright runs, so we interact with this
    // one last.
    // TODO: Figure out why.
    await gradeInput.selectGradeLevel('8th grade')

    await page.getByTestId('eligibility-form-submit-btn').click()
    await page.waitForURL('**/sign-up/student/eligible')

    await page.getByText('Continue').click()
    await page.waitForURL('**/sign-up/student/account')

    await expect(studentFirstNameInput).toBeEditable()
    await studentFirstNameInput.click()
    await page.waitForTimeout(100)
    await studentFirstNameInput.fill(faker.person.firstName())
    await studentLastNameInput.click()
    await studentLastNameInput.fill(faker.person.lastName())

    await passwordInput.click()
    await passwordInput.fill('Password123')
    await expect(createAccountButton).toBeEnabled()
    await createAccountButton.click()
    await page.waitForURL('**/verify')
  })

  test('partner student', async ({ page }) => {
    await page.goto(
      BASE_SIGN_UP_URL + '/student/eligibility?partner=college-mentors'
    )

    const { gradeInput, schoolInput, zipInput, studentEmailInput } =
      getFormFields(page)

    await schoolInput.click()
    await schoolInput.fill('Unapproved School')
    await page.getByText(/Unapproved School*/).click()
    await zipInput.fill('00000')
    await studentEmailInput.fill('partnerstudenteligibility@e2etest.com')
    await gradeInput.selectGradeLevel('10th grade')

    await page.getByTestId('eligibility-form-submit-btn').click()
    await page.waitForURL('**/sign-up/student/eligible')
  })

  test('parent/guardian', async ({ page }) => {
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
    await schoolInput.click()
    await schoolInput.fill('Another Approved')
    await page.getByText(/Another Approved*/).click()
    await zipInput.fill('00000')
    await studentEmailInput.fill(faker.internet.email())
    await parentGuardianEmailInput.fill(faker.internet.email())
    await gradeInput.selectGradeLevel('7th grade')

    await page.getByTestId('eligibility-form-submit-btn').click()
    await page.waitForSelector('#pg-confirmation-message')
  })
})
