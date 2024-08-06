import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import {
  SignUpPage,
  getRow,
  getTextElement,
  getInputElement,
  getButtonElement,
  getAlreadyHaveAccountElements,
  getSubmitResponseDefault as getSubmitResponse,
} from '@/services/SignUpService'
import { getLinkElement, getRouterLinkElement } from '.'

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
  SIGNUP_SOURCE: 'signupSource',
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
  return to.path === RoutePath.account
}

function getEligibilityPageDetails() {
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    panelImage: 'empower-your-students',
    classes: 'uc-column justify-center justify-start-sm',
    rows: [
      getRow(
        'justify-center',
        {
          element: 'header-logo-teal',
        }
      ),
      getRow(
        'mt-4',
        getTextElement(
          'h1',
          `Check if you're eligible for a FREE teacher account`
        )
      ),
      getRow('justify-start mt-1 el-gap-sm', ...getAlreadyHaveAccountElements()),
      getRow('mt-3', {
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
      getRow('mt-2', getInputElement(InputName.SIGNUP_SOURCE, 'How did you hear about us?', EVENTS.TEACHER_ENTERED_SIGNUP_SOURCE)),
      getRow('mt-4 justify-start', {
        element: 'FormCheckBox',
        props: {
          label: 'I work with 6th through 12th grade students',
          name: InputName.WORKS_WITH_ELIGIBLE_STUDENTS,
        },
      }),
      getRow('mt-5', getButtonElement(checkEligibility, 'Check eligibility')),
    ],
  }
}

async function checkEligibility(data) {
  AnalyticsService.captureEvent(EVENTS.TEACHER_CLICKED_CHECK_ELIGIBILITY)
  try {
    const {
      data: { isEligible },
    } = await NetworkService.checkTeacherEligibility({
      [InputName.SCHOOL_ID]: data[InputName.SCHOOL_ID],
    })
    AnalyticsService.captureEvent(
      isEligible
        ? EVENTS.TEACHER_ELIGIBILITY_ELIGIBLE
        : EVENTS.TEACHER_ELIGIBILITY_INELIGIBLE,
      { schoolId: data[InputName.SCHOOL_ID] }
    )

    return getSubmitResponse(
      isEligible ? SignUpPage.account : SignUpPage.ineligible,
      data
    )
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

function getIneligiblePageDetails() {
  return {
    backgroundLayout: 'full',
    rows: [
      getRow('justify-center center mt-3', getTextElement('h1', `Sorry! You're not eligible for an UPchieve account 😞`)),
      getRow('justify-center center mt-2', getTextElement('p', 'UPchieve teacher accounts are only for 6th-12th grade teachers who work in Title I or majority low-income schools in the U.S.')),
      getRow('justify-center center mt-4', getTextElement('p', 'Did we make a mistake?')),
      getRow('justify-center center', getLinkElement('Request we add your school.', 'https://upchieve.org/cant-find-school')),
      getRow('justify-center center mt-3', getTextElement('p', 'Do you teach low-income students in a different setting?')),
      getRow('justify-center center', getRouterLinkElement('Your students can check their individual eligibility.', '/sign-up/student/eligibility')),
      getRow('justify-center center mt-3', getTextElement('p', 'Know teachers who do work in Title I or low-income schools?')),
      getRow('justify-center center', getLinkElement('Please share UPchieve with them!', 'https://upchieve.org/teachers')),
    ],
  }
}

function getAccountPageDetails() {
  return {
    backgroundLayout: 'panel-right-75p',
    submitAction: createAccount,
    rows: [
      getRow(
        'justify-start mt-4',
        {
          element: 'header-logo-teal',
        }
      ),
      getRow('mt-4', getTextElement('h1', 'Your school is eligible! 🎉')),
      getRow('mt-3', getTextElement('h2', 'Finish creating your account')),
      getRow(
        'mt-3 uc-column-sm',
        getInputElement(
          InputName.FIRST_NAME,
          'First Name',
          EVENTS.TEACHER_ENTERED_FIRST_NAME,
        ),
        getInputElement(
          InputName.LAST_NAME,
          'Last Name',
          EVENTS.TEACHER_ENTERED_LAST_NAME,
        )
      ),
      getRow('mt-2', {
        element: 'FormEmail',
        props: {
          name: InputName.EMAIL,
          label: 'Email',
          blurEvent: EVENTS.TEACHER_ENTERED_EMAIL,
        },
      }),
      getRow('mt-2', {
        element: 'FormPassword',
        props: {
          name: InputName.PASSWORD,
          metadata:
            'Must have at least one number, one uppercase letter, one lowercase letter, and be at least 8 characters long.',
          blurEvent: EVENTS.TEACHER_ENTERED_PASSWORD,
        },
      }),
      getRow('mt-4', getButtonElement(createAccount, 'Confirm')),
    ],
  }
}

async function createAccount(data) {
  try {
    await NetworkService.registerTeacher({
      [InputName.EMAIL]: data[InputName.EMAIL],
      [InputName.FIRST_NAME]: data[InputName.FIRST_NAME],
      [InputName.LAST_NAME]: data[InputName.LAST_NAME],
      [InputName.PASSWORD]: data[InputName.PASSWORD],
      [InputName.SCHOOL_ID]: data[InputName.SCHOOL_ID],
      [InputName.SIGNUP_SOURCE]: data[InputName.SIGNUP_SOURCE],
    })

    return getSubmitResponse(SignUpPage.verify)
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

export async function beforeEnter(to, from, next) {
  if (
    // Teachers must start from the eligibility page,
    // unless it is an error redirect.
    to.params.step !== 'eligibility' &&
    !from.name &&
    !to.query.error
  ) {
    return next({
      name: 'SignupView',
      params: { step: 'eligibility', userType: to.params.userType },
      query: to.query,
    })
  }
  return next()
}
