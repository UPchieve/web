import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import {
  SignUpPage,
  getRow,
  getTextElement,
  getInputElement,
  getButtonElement,
  continueToAccountPage,
} from '@/services/SignUpService'

const RoutePath = {
  account: `/sign-up/teacher/${SignUpPage.account}`,
  eligibility: `/sign-up/teacher/${SignUpPage.eligibility}`,
  ineligible: `/sign-up/teacher/${SignUpPage.ineligible}`,
  verify: `/${SignUpPage.verify}`,
}

export const InputName = {
  EMAIL: 'email',
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  PASSWORD: 'password',
  SCHOOL_ID: 'schoolId',
  WORKS_WITH_ELIGIBLE_STUDENTS: 'worksWithEligibleStudents',
}

export function getPageDetails(to, from) {
  if (isIneligibleRoute(to, from)) {
    return getIneligiblePageDetails()
  }

  if (isAccountRoute(to, from)) {
    return getAccountPageDetails()
  }

  return getEligibilityPageDetails(to, from)
}

function isIneligibleRoute(to) {
  return to.path === RoutePath.ineligible
}

function isAccountRoute(to, from) {
  return to.path === RoutePath.account && from?.path === RoutePath.eligibility
}

function getEligibilityPageDetails() {
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    rows: [
      getRow(
        null,
        getTextElement(
          'h1',
          'Check if your students are eligible for UPchieve!'
        )
      ),
      getRow(null, {
        element: 'FormSchoolSearch',
        props: {
          name: InputName.SCHOOL_ID,
          label: 'School Name',
          placeholder: 'School Name',
          startSearchEvent: EVENTS.TEACHER_SEARCHED_SCHOOL,
          cannotFindSchoolEvent: EVENTS.TEACHER_CLICKED_CANT_FIND_SCHOOL,
          selectedEvent: EVENTS.TEACHER_SELECTED_SCHOOL,
        },
      }),
      getRow('justify-start', {
        element: 'FormCheckBox',
        props: {
          label: 'I work with 6th through 12th grade students',
          name: InputName.WORKS_WITH_ELIGIBLE_STUDENTS,
        },
      }),
      getRow(null, { element: 'br' }),
      getRow(null, getButtonElement(checkEligibility, 'Check eligibility')),
    ],
  }
}

function checkEligibility(data) {
  // TODO: Actually check eligibility.
  AnalyticsService.captureEvent(EVENTS.TEACHER_CLICKED_CHECK_ELIGIBILITY)
  return continueToAccountPage(data)
}

function getIneligiblePageDetails() {
  return {
    backgroundLayout: 'full',
    rows: [
      // TODO: Design.
      getRow(null, getTextElement('h1', 'Not eligible :(')),
    ],
  }
}

function getAccountPageDetails() {
  return {
    backgroundLayout: 'panel-right-75p',
    submitAction: createAccount,
    // TODO: Update copy.
    rows: [
      getRow(null, getTextElement('h1', 'Your school is eligible! 🎉')),
      getRow(null, getTextElement('h2', 'Create an Account')),
      getRow(
        null,
        getInputElement(
          InputName.FIRST_NAME,
          'First Name',
          EVENTS.TEACHER_ENTERED_FIRST_NAME
        ),
        getInputElement(
          InputName.LAST_NAME,
          'Last Name',
          EVENTS.TEACHER_ENTERED_LAST_NAME
        )
      ),
      getRow(null, {
        element: 'FormEmail',
        props: {
          name: InputName.EMAIL,
          label: 'Email',
          blurEvent: EVENTS.TEACHER_ENTERED_EMAIL,
        },
      }),
      getRow(null, {
        element: 'FormPassword',
        props: {
          name: InputName.PASSWORD,
          metadata:
            'Must have at least one number, one uppercase letter, one lowercase letter, and be at least 8 characters long.',
          blurEvent: EVENTS.TEACHER_ENTERED_PASSWORD,
        },
      }),
      getRow(null, getButtonElement(createAccount, 'Confirm')),
    ],
  }
}

function createAccount(data) {
  // eslint-disable-next-line no-console
  console.info('Create Account!', data)
}
