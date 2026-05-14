import type {
  RouteLocation,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router'
import { EVENTS } from '@/consts'
import store from '@/store'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import * as SignUpService from '@/services/SignUpService'
import { SignUpPage, UserType } from '@/services/SignUpService/types'
import {
  getRow,
  getTextElement,
  getInputElement,
  getButtonElement,
  getAlreadyHaveAccountElements,
  getSubmitResponse,
  getSsoButton,
  getLinkElement,
  getRouterLinkElement,
} from '@/services/SignUpService'
import type {
  PageDetail,
  PageDetailsUnion,
  SubmitActionResponse,
  FormRow,
} from '@/services/SignUpService'
import { SsoProvider } from '@/services/SsoService'

const RoutePath = {
  account: `/sign-up/teacher/${SignUpPage.account}`,
  eligibility: `/sign-up/teacher/${SignUpPage.eligibility}`,
  ineligible: `/sign-up/teacher/${SignUpPage.ineligible}`,
  verify: `/${SignUpPage.verify}`,
}

// The following values are used as the `name` attribute on form elements,
// and should match the keys in server requests.
export enum InputName {
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  PASSWORD = 'password',
  SCHOOL_ID = 'schoolId',
  SIGNUP_SOURCE = 'signupSource',
  WORKS_WITH_ELIGIBLE_STUDENTS = 'worksWithEligibleStudents',
}

export type TeacherSignUpFormData =
  | TeacherEligibilityFormData
  | TeacherAccountFormData

export type TeacherEligibilityFormData = {
  [InputName.SCHOOL_ID]?: string
  [InputName.SIGNUP_SOURCE]?: string
  [InputName.WORKS_WITH_ELIGIBLE_STUDENTS]?: boolean
}

export type TeacherAccountFormData = {
  [InputName.EMAIL]?: string
  [InputName.FIRST_NAME]?: string
  [InputName.LAST_NAME]?: string
  [InputName.PASSWORD]?: string
  [InputName.SCHOOL_ID]?: string
  [InputName.SIGNUP_SOURCE]?: string
}

export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.ineligible }
): PageDetail<{}> // eslint-disable-line @typescript-eslint/no-empty-object-type
export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.account }
): PageDetail<TeacherAccountFormData>
export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.eligibility }
): PageDetail<TeacherEligibilityFormData>
export function getPageDetails(
  to: RouteLocation
): PageDetailsUnion<TeacherSignUpFormData> {
  if (isIneligibleRoute(to)) {
    return getIneligiblePageDetails()
  }

  if (isAccountRoute(to)) {
    return getAccountPageDetails()
  }

  return getEligibilityPageDetails()
}

function isIneligibleRoute(to: RouteLocation) {
  return to.path === RoutePath.ineligible
}

function isAccountRoute(to: RouteLocation) {
  return to.path === RoutePath.account
}

function getEligibilityPageDetails(): PageDetail<TeacherEligibilityFormData> {
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    panelImage: 'connect-your-students',
    classes: 'uc-column justify-center justify-start-sm',
    rows: [
      getRow('justify-center', {
        element: 'header-logo-teal',
      }),
      getRow(
        'mt-4',
        getTextElement(
          'h1',
          `Check if you're eligible for a FREE teacher account`
        )
      ),
      getRow(
        'justify-start mt-1 el-gap-sm',
        ...getAlreadyHaveAccountElements()
      ),
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
      getRow(
        'mt-2',
        getInputElement(
          InputName.SIGNUP_SOURCE,
          'How did you hear about us?',
          EVENTS.TEACHER_ENTERED_SIGNUP_SOURCE
        )
      ),
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

async function checkEligibility(
  data: TeacherEligibilityFormData
): Promise<SubmitActionResponse> {
  AnalyticsService.captureEvent(EVENTS.TEACHER_CLICKED_CHECK_ELIGIBILITY)

  if (!data.schoolId) {
    return getSubmitResponse(null, null, 'Must select a school.')
  }

  if (SignUpService.ensureHasNoRecentIneligibility(UserType.teacher)) {
    return getSubmitResponse(SignUpPage.ineligible, data)
  }

  try {
    const {
      data: { isEligible },
    } = await NetworkService.checkTeacherEligibility({
      [InputName.SCHOOL_ID]: data.schoolId,
    })

    return SignUpService.handleEligibilityResult(
      isEligible,
      UserType.teacher,
      data,
      {
        schoolId: data.schoolId,
      }
    )
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function getIneligiblePageDetails(): PageDetail<{}> {
  return {
    backgroundLayout: 'full',
    submitAction: ineligibleContinue,
    rows: [
      getRow(
        'justify-center center mt-3',
        getTextElement(
          'h1',
          `Sorry! You're not eligible for an UPchieve account 😞`
        )
      ),
      getRow(
        'justify-center center mt-2',
        getTextElement(
          'p',
          'UPchieve teacher accounts are only for 6th-12th grade teachers who work in Title I or majority low-income schools in the U.S.'
        )
      ),
      getRow(
        'justify-center center mt-4',
        getTextElement('p', 'Did we make a mistake?')
      ),
      getRow(
        'justify-center center',
        getLinkElement(
          'Request we add your school.',
          'https://upchieve.org/cant-find-school'
        )
      ),
      getRow(
        'justify-center center mt-3',
        getTextElement(
          'p',
          'Do you teach low-income students in a different setting?'
        )
      ),
      getRow(
        'justify-center center',
        getRouterLinkElement(
          'Your students can check their individual eligibility.',
          '/sign-up/student/eligibility'
        )
      ),
      getRow(
        'justify-center center mt-3',
        getTextElement(
          'p',
          'Know teachers who do work in Title I or low-income schools?'
        )
      ),
      getRow(
        'justify-center center',
        getLinkElement(
          'Please share UPchieve with them!',
          'https://upchieve.org/teachers'
        )
      ),
    ],
  }
}

function ineligibleContinue(): SubmitActionResponse {
  window.location.replace('https://upchieve.org/cant-find-school')
  return [null, null]
}

function getAccountPageDetails(): PageDetail<TeacherAccountFormData> {
  return {
    backgroundLayout: 'panel-right-75p',
    submitAction: createAccount,
    rows: [
      getRow('justify-start mt-4', {
        element: 'header-logo-teal',
      }),
      getRow('mt-4', getTextElement('h1', 'Your school is eligible! 🎉')),
      getRow('mt-3', getTextElement('h2', 'Finish creating your account')),
      ...getSsoSectionElements(),
      getRow(
        'justify-center italic mt-3',
        getTextElement(
          'p',
          'By clicking the button above, you agree to our User Agreement'
        )
      ),
      getRow('mt-2 mb-2', { element: 'LineDivider', props: { text: 'or' } }),
      getRow(
        'mt-3 uc-column-sm',
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
          showPasswordRequirements: true,
          blurEvent: EVENTS.TEACHER_ENTERED_PASSWORD,
        },
      }),
      getRow(
        'mt-4',
        getButtonElement<TeacherAccountFormData>(createAccount, 'Confirm')
      ),
    ],
  }
}

async function createAccount(data: TeacherAccountFormData) {
  AnalyticsService.captureEvent(EVENTS.TEACHER_CLICKED_CREATE_ACCOUNT)
  try {
    await NetworkService.registerTeacher({
      [InputName.EMAIL]: data.email,
      [InputName.FIRST_NAME]: data.firstName,
      [InputName.LAST_NAME]: data.lastName,
      [InputName.PASSWORD]: data.password,
      [InputName.SCHOOL_ID]: data.schoolId,
      [InputName.SIGNUP_SOURCE]: data.signupSource,
    })

    return getSubmitResponse(SignUpPage.verify)
  } catch (err) {
    return getSubmitResponse(null, null, err)
  }
}

function createAccountWithProvider(
  provider: SsoProvider,
  data: TeacherAccountFormData
) {
  AnalyticsService.captureEvent(EVENTS.TEACHER_CLICKED_CREATE_ACCOUNT, {
    provider,
  })
  return SignUpService.createAccountWithProvider(
    provider,
    UserType.teacher,
    data
  )
}

export function createAccountWithClever(data: TeacherAccountFormData) {
  return createAccountWithProvider(SsoProvider.CLEVER, data)
}

export function createAccountWithGoogle(data: TeacherAccountFormData) {
  return createAccountWithProvider(SsoProvider.GOOGLE, data)
}

export function createAccountWithClassLink(data: TeacherAccountFormData) {
  return createAccountWithProvider(SsoProvider.CLASSLINK, data)
}

export async function beforeEnter(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
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

function getSsoSectionElements(): FormRow[] {
  const isMobileMode = store.getters['app/mobileMode']
  const isClassLinkSsoEnabled =
    store.getters['featureFlags/isClassLinkSsoEnabled']
  const cleverButton = getSsoButton(
    createAccountWithClever,
    'Clever',
    SsoProvider.CLEVER
  )
  const googleButton = getSsoButton(
    createAccountWithGoogle,
    'Google',
    SsoProvider.GOOGLE
  )
  const classLinkButton = isClassLinkSsoEnabled
    ? getSsoButton(
        createAccountWithClassLink,
        'ClassLink',
        SsoProvider.CLASSLINK
      )
    : undefined

  if (isMobileMode) {
    return [
      getRow('mt-3', cleverButton),
      ...(classLinkButton ? [getRow('mt-3', classLinkButton)] : []),
      getRow('mt-3', googleButton),
    ]
  }
  return [getRow('mt-3', cleverButton, classLinkButton, googleButton)]
}
