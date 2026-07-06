import type {
  NavigationGuardNext,
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationRaw,
} from 'vue-router'
import store from '@/store'
import { GRADES, EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import AuthService from '@/services/AuthService'
import * as SignUpService from '@/services/SignUpService'
import { SignUpPage, UserType } from '@/services/SignUpService/types'
import {
  getFilteredPageDetails,
  getRow,
  getTextElement,
  getButtonElement,
  getRouterLinkElement,
  getSsoButton,
  getAlreadyHaveAccountElements,
  getSignUpSourceElement,
  getInputElement,
  getSubmitResponse,
} from '@/services/SignUpService'
import type {
  PageDetail,
  FormElement,
  FormRow,
  SubmitActionResponse,
  PageDetailsUnion,
} from '@/services/SignUpService'
import NetworkService, { type NetworkError } from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { SsoProvider } from '@/services/SsoService'
import { getFormAddressee, getLabelPrefix } from '@/utils/signup-utils'
import featureFlags from '@/store/modules/feature-flags'

const RoutePath = {
  account: `/sign-up/student/${SignUpPage.account}`,
  eligibility: `/sign-up/student/${SignUpPage.eligibility}`,
  ineligible: `/sign-up/student/${SignUpPage.ineligible}`,
  international: `/sign-up/student/${SignUpPage.international}`,
  parentGuardianConfirmation: `/sign-up/student/${SignUpPage.parentGuardianConfirmation}`,
  partnerInfo: `sign-up/student/${SignUpPage.partnerInfo}`,
  verify: `/${SignUpPage.verify}`,
}

// The following values are used as the `name` attribute on form elements,
// and should match the keys in server requests.
export enum InputName {
  CLASS_CODE = 'classCode',
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  GRADE_LEVEL = 'gradeLevel',
  LAST_NAME = 'lastName',
  PARENT = 'parent',
  PARENT_GUARDIAN_EMAIL = 'parentGuardianEmail',
  PASSWORD = 'password',
  REFERRED_BY_CODE = 'referredByCode',
  SCHOOL_ID = 'schoolId',
  SIGNUP_SOURCE_ID = 'signupSourceId',
  STUDENT_PARTNER_ORG_KEY = 'studentPartnerOrgKey',
  STUDENT_PARTNER_ORG_SITE_NAME = 'studentPartnerOrgSiteName',
  TERMS = 'terms',
  VALIDATOR = 'validator',
  ZIP_CODE = 'zipCode',
}

export type StudentSignUpFormData =
  | StudentEligibilityFormData
  | StudentAccountFormData
  | ParentGuardianReset
  | CleverStudentRedirectFormData

export type StudentEligibilityFormData = {
  [InputName.CLASS_CODE]?: string
  [InputName.GRADE_LEVEL]?: string
  [InputName.PARENT]?: string // 'true' if defined.
  [InputName.STUDENT_PARTNER_ORG_KEY]?: string
  [InputName.STUDENT_PARTNER_ORG_SITE_NAME]?: string
  [InputName.SCHOOL_ID]?: string
  [InputName.SIGNUP_SOURCE_ID]?: number
  [InputName.ZIP_CODE]?: string
}

export type StudentAccountFormData = {
  [InputName.CLASS_CODE]?: string
  [InputName.EMAIL]?: string
  [InputName.GRADE_LEVEL]?: string
  [InputName.FIRST_NAME]?: string
  [InputName.LAST_NAME]?: string
  [InputName.PASSWORD]?: string
  [InputName.PARENT_GUARDIAN_EMAIL]?: string
  [InputName.PARENT]?: string // 'true' if defined.
  [InputName.PASSWORD]?: string
  [InputName.SCHOOL_ID]?: string
  [InputName.SIGNUP_SOURCE_ID]?: string
  [InputName.STUDENT_PARTNER_ORG_KEY]?: string
  [InputName.STUDENT_PARTNER_ORG_SITE_NAME]?: string
  [InputName.ZIP_CODE]?: string
}

type ParentGuardianReset = {
  [InputName.PARENT]: string
  [InputName.STUDENT_PARTNER_ORG_KEY]?: string
}

type CleverStudentRedirectFormData = {
  [InputName.EMAIL]: string
  [InputName.VALIDATOR]: string
}

export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.international },
  from: RouteLocation
): PageDetail<{}> // eslint-disable-line @typescript-eslint/no-empty-object-type
export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.ineligible },
  from: RouteLocation
): PageDetail<{}> // eslint-disable-line @typescript-eslint/no-empty-object-type
export function getPageDetails(
  to: RouteLocation & { query: { isCleverStudentEmailRedirect: 'true' } },
  from: RouteLocation
): PageDetail<CleverStudentRedirectFormData>
export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.account },
  from: RouteLocation
): PageDetail<StudentAccountFormData>
export function getPageDetails(
  to: RouteLocation & { params: { parent: 'true' } },
  from: RouteLocation
): PageDetail<ParentGuardianReset>
export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.eligibility },
  from: RouteLocation
): PageDetail<StudentEligibilityFormData>
export function getPageDetails(
  to: RouteLocation,
  from: RouteLocation
): PageDetailsUnion<StudentSignUpFormData> {
  return getFilteredPageDetails(() => {
    if (isInternationalRoute(to)) {
      return featureFlags.getters['showNewInternationalMessage']
        ? getExperimentalIntlDetails()
        : getInternationalPageDetails()
    }

    if (isIneligibleRoute(to)) {
      return getIneligiblePageDetails()
    }

    if (isCleverStudentRedirect(to)) {
      return getCleverStudentRedirectPageDetails()
    }

    if (isAccountRoute(to)) {
      return getAccountPageDetails(to)
    }

    if (isParentGuardianConfirmationRoute(to, from)) {
      return getParentGuardianConfirmationDetails(to)
    }

    return getEligibilityPageDetails(to)
  })
}

function isInternationalRoute(to: RouteLocation) {
  return to.path === RoutePath.international
}

function isIneligibleRoute(to: RouteLocation) {
  return to.path === RoutePath.ineligible
}

function isCleverStudentRedirect(to: RouteLocation) {
  return to.query.isCleverStudentEmailRedirect === 'true'
}

function isAccountRoute(to: RouteLocation) {
  return to.path === RoutePath.account
}

function isParentGuardianSignUp(to: RouteLocation) {
  return to.params.parent === 'true'
}

function isGreatSchoolsStudent(to: RouteLocation) {
  return to.params.studentPartnerOrgKey === 'great-schools'
}

function isParentGuardianConfirmationRoute(
  to: RouteLocation,
  from?: RouteLocation
) {
  return (
    to.path === RoutePath.parentGuardianConfirmation &&
    from?.path === RoutePath.account
  )
}

function getEligibilityPageDetails(
  to: RouteLocation
): PageDetail<StudentEligibilityFormData> {
  function isOrganicStudentSignUp() {
    return !isPartnerStudentSignUp()
  }
  function isPartnerStudentSignUp() {
    return !!to.params.studentPartnerOrgKey
  }
  function isCodeDotOrgStudent() {
    return to.params.studentPartnerOrgKey === 'code-org'
  }
  function isBigFutureStudent() {
    return to.params.studentPartnerOrgKey === 'bigfuture'
  }
  function isCollegeConfidentialStudent() {
    return to.params['utm_source'] === 'collegeconfidential'
  }
  function getHeaderText() {
    if (isGreatSchoolsStudent(to)) {
      return "Hey! 👋 We're UPchieve, a non-profit on a mission to help all children get the academic support they deserve."
    }
    if (isParentGuardianSignUp(to)) {
      return 'Check if your child is eligible for free tutoring with UPchieve'
    }
    if (isCodeDotOrgStudent()) {
      return 'Welcome to UPchieve!'
    }
    if (isCollegeConfidentialStudent()) {
      return `Get that A you deserve!`
    }

    if (to.params.studentPartnerName) {
      return `Welcome ${to.params.studentPartnerName} ${getFormAddressee(isParentGuardianSignUp(to))}!`
    }

    return 'Check if you are eligible for UPchieve'
  }

  function getSubheaderText() {
    const bfIntroCopy = store.getters['featureFlags/bfIntroCopy']
    if (isBigFutureStudent() && bfIntroCopy) {
      return bfIntroCopy
    }
    if (isCollegeConfidentialStudent()) {
      return 'Students who use UPchieve get better grades in their classes and are more competitive during college admission season! Sign up for free access to the 24/7 academic support that can help you achieve your dream.'
    }
    if (isCodeDotOrgStudent()) {
      return 'Create an account now to access FREE, 24/7 tutoring in all your classes, including AP Computer Science.'
    }
    if (isGreatSchoolsStudent(to)) {
      return 'Check if your child is eligible for FREE 1:1 tutoring!'
    }
  }

  function includeSchoolElement() {
    if (isPartnerStudentSignUp()) {
      return to.params.studentPartnerIsSchool !== 'true'
    }
    return true
  }

  function isSchoolRequired() {
    if (isPartnerStudentSignUp()) {
      return to.params.schoolSignupRequired === 'true'
    }
    return true
  }

  const isParentGuardian = isParentGuardianSignUp(to)
  const subheaderText = getSubheaderText()
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    panelImage: isGreatSchoolsStudent(to)
      ? 'we-can-help-subjects'
      : 'chat-one-on-one',
    classes: 'uc-column justify-center justify-start-md',
    rows: [
      getRow('justify-center', {
        element: 'header-logo-teal',
      }),
      getRow('mt-4', getTextElement('h1', getHeaderText())),
      subheaderText ? getRow('mt-2', getTextElement('p', subheaderText)) : null,
      isPartnerStudentSignUp()
        ? getRow(
            'justify-start mt-1',
            getRouterLinkElement(
              `Not with ${to.params.studentPartnerName}?`,
              '/sign-up/student/eligibility'
            )
          )
        : getRow(
            'justify-start mt-1 el-gap-sm',
            ...getAlreadyHaveAccountElements()
          ),
      isPartnerStudentSignUp() && to.params.studentPartnerSites?.length
        ? getRow('mt-2', getPartnerSitesElement(to))
        : null,
      getRow(
        'mt-2',
        getGradeSelectionElement(isParentGuardian),
        getZipCodeElement()
      ),
      includeSchoolElement()
        ? getRow('mt-2', {
            element: 'FormSchoolSearch',
            props: {
              name: InputName.SCHOOL_ID,
              label: getLabelPrefix(isParentGuardian) + 'School Name',
              placeholder: getLabelPrefix(isParentGuardian) + 'School Name',
              isRequired: isSchoolRequired(),
            },
            showIf: (form) => {
              return [
                '6th',
                '7th',
                '8th',
                '9th',
                '10th',
                '11th',
                '12th',
              ].includes(form.gradeLevel)
            },
          })
        : null,
      isOrganicStudentSignUp()
        ? getRow(
            'mt-2',
            getSignUpSourceElement(
              InputName.SIGNUP_SOURCE_ID,
              true,
              EVENTS.STUDENT_SELECTED_HOW_DID_YOUR_HEAR_ABOUT_US
            )
          )
        : null,
      getRow('mt-4', getButtonElement(checkEligibility, 'Check eligibility')),
    ],
  }
}

async function checkEligibility(
  data: StudentEligibilityFormData
): Promise<SubmitActionResponse> {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY, {
    partnerKey: data.studentPartnerOrgKey,
  })

  if (
    SignUpService.ensureHasNoRecentIneligibility(UserType.student, {
      partnerKey: data.studentPartnerOrgKey,
    })
  ) {
    return getSubmitResponse(SignUpPage.ineligible, data)
  }

  try {
    const {
      data: { isEligible },
    } = await NetworkService.checkStudentEligibility({
      [InputName.EMAIL]: '',
      [InputName.GRADE_LEVEL]: data.gradeLevel,
      [InputName.REFERRED_BY_CODE]:
        window.localStorage.getItem('upcReferredByCode'),
      [InputName.SCHOOL_ID]: data.schoolId,
      [InputName.ZIP_CODE]: data.zipCode ?? '',
    })

    return SignUpService.handleEligibilityResult(
      isEligible,
      UserType.student,
      data,
      {
        partnerKey: data.studentPartnerOrgKey,
        schoolId: data.schoolId,
        zipCode: data.zipCode,
      }
    )
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function getExperimentalIntlDetails(): PageDetail<{}> {
  return {
    backgroundLayout: 'full',
    submitAction: () => {
      return [{ path: '/contact' }, null]
    },
    classes: 'text-center screen-narrow',
    rows: [
      getRow('uc-row justify-center', {
        element: 'InternationalMessage',
      }),
    ],
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function getInternationalPageDetails(): PageDetail<{}> {
  return {
    backgroundLayout: 'full',
    submitAction: () => {
      return [{ path: '/contact' }, null]
    },
    classes: 'text-center screen-narrow',
    rows: [
      getRow('uc-row justify-center', {
        element: 'error-badge',
        classes: 'error-badge',
      }),
      getRow(
        'justify-center center mt-4 pre-wrap',
        getTextElement('h1', "Looks like you're not in\nthe US!")
      ),
      getRow(
        'justify-center center mt-3 pre-wrap',
        getTextElement(
          'p',
          "UPchieve is currently only available to students in the US.\nWe're sorry for the inconvenience! 😔"
        )
      ),
      getRow(
        'justify-center center mt-3 italic pre-wrap',
        getTextElement(
          'p',
          "Live in the US and still seeing this message?\nMake sure you're not using a VPN."
        )
      ),
      getRow(
        'justify-center mt-3 el-gap-sm',
        getRouterLinkElement('Contact us', '/contact'),
        getTextElement('p', 'if you still need help!')
      ),
    ],
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function getIneligiblePageDetails(): PageDetail<{}> {
  return {
    backgroundLayout: 'full',
    submitAction: ineligibleContinue,
    classes: 'text-center screen-narrow',
    rows: [
      getRow('uc-row justify-center', {
        element: 'updog-crying',
        classes: 'updog',
      }),
      getRow(
        'justify-center center mt-4',
        getTextElement('h1', "Oops... looks like you're not eligible")
      ),
      getRow(
        'justify-center center mt-3',
        getTextElement(
          'p',
          "While we weren't able to verify your eligibility based on the info provided, don't worry: you may still be eligible! We just need your parent/guardian to answer some more questions first!"
        )
      ),
      getRow(
        'justify-center mt-3',
        getButtonElement(ineligibleContinue, 'Continue', 'button-narrow', false)
      ),
    ],
  }
}

function ineligibleContinue(): SubmitActionResponse {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_STUDENT_ACCESS_PAGE)
  window.location.replace('https://upchieve.org/request-access')
  return [null, null]
}

/*
 * When a student profile coming from Clever SSO doesn't have an email, we redirect to this
 * form to get the student's email before registering them.
 */
function getCleverStudentRedirectPageDetails(): PageDetail<CleverStudentRedirectFormData> {
  return {
    backgroundLayout: 'card',
    submitAction: createAccountWithMissingEmail,
    rows: [
      getRow(
        'justify-center center mt-4',
        getTextElement('h1', 'Welcome Clever student!')
      ),
      getRow(
        'justify-center center mt-3',
        getTextElement(
          'p',
          'Enter your student email to get started using UPchieve.'
        )
      ),
      getRow('mt-2', getStudentEmailElement()),
      getRow(
        'justify-center mt-3',
        getButtonElement(createAccountWithMissingEmail, 'Continue')
      ),
    ],
  }
}

async function createAccountWithMissingEmail(
  data: CleverStudentRedirectFormData
) {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CREATE_ACCOUNT)
  try {
    await AuthService.registerStudent({
      [InputName.EMAIL]: data.email,
      [InputName.VALIDATOR]: data.validator,
    })

    return getSubmitResponse(SignUpPage.verify, data)
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

function getAccountPageDetails(
  to: RouteLocation
): PageDetail<StudentAccountFormData> {
  const isParentGuardian = isParentGuardianSignUp(to)
  const isClassCodeSignUp = !!to.params.classCode

  function getH1Text() {
    if (isClassCodeSignUp) {
      return `You're almost done! 🎉`
    }

    const prefixIdentifier = isParentGuardian ? 'Your child is ' : "You're "
    return prefixIdentifier + 'eligible for UPchieve! 🎉'
  }
  function getH2Text() {
    const suffix = ` to join class ${to.params.classCode}`
    return (
      `Finish creating ${isParentGuardian ? "your child's" : 'your'} account` +
      (isClassCodeSignUp ? suffix : '')
    )
  }

  return {
    backgroundLayout: isGreatSchoolsStudent(to)
      ? 'panel-right-50p'
      : 'panel-right-75p',
    panelImage: isGreatSchoolsStudent(to) ? 'trusted-by-students' : undefined,
    submitAction: createAccount,
    rows: [
      getRow('justify-start', {
        element: 'header-logo-teal',
      }),
      getRow('mt-4', getTextElement('h1', getH1Text())),
      getRow('mt-3', getTextElement('h2', getH2Text())),
      ...(!isParentGuardian ? getSsoSectionElements() : []),
      isParentGuardian ? getRow('mt-2', getParentGuardianEmailElement()) : null,
      getRow(
        'mt-2 uc-column-sm',
        getInputElement(
          InputName.FIRST_NAME,
          getLabelPrefix(isParentGuardian) + 'First Name',
          EVENTS.STUDENT_ENTERED_FIRST_NAME
        ),
        getInputElement(
          InputName.LAST_NAME,
          getLabelPrefix(isParentGuardian) + 'Last Name',
          EVENTS.STUDENT_ENTERED_LAST_NAME
        )
      ),
      !isClassCodeSignUp
        ? getRow('mt-2', getStudentEmailElement(isParentGuardian))
        : null,
      !isParentGuardian
        ? getRow('mt-2', {
            element: 'FormPassword',
            props: {
              label: 'Password',
              name: InputName.PASSWORD,
              showPasswordRequirements: true,
              blurEvent: EVENTS.STUDENT_ENTERED_PASSWORD,
            },
          })
        : null,
      ...getTermsCheckboxElements(),
      getRow(
        'justify-end mt-4',
        getButtonElement<StudentAccountFormData>(
          createAccount,
          'Confirm',
          'button-narrow'
        )
      ),
    ],
  }
}

async function createAccount(data: StudentAccountFormData) {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CREATE_ACCOUNT)
  try {
    await AuthService.registerStudent({
      [InputName.CLASS_CODE]: data.classCode,
      [InputName.EMAIL]: data.email,
      [InputName.FIRST_NAME]: data.firstName,
      [InputName.GRADE_LEVEL]: data.gradeLevel,
      [InputName.LAST_NAME]: data.lastName,
      [InputName.PARENT_GUARDIAN_EMAIL]: data.parentGuardianEmail,
      [InputName.PASSWORD]: data.password,
      [InputName.REFERRED_BY_CODE]:
        window.localStorage.getItem('upcReferredByCode'),
      [InputName.SCHOOL_ID]: data.schoolId,
      [InputName.SIGNUP_SOURCE_ID]: data.signupSourceId,
      [InputName.STUDENT_PARTNER_ORG_KEY]: data.studentPartnerOrgKey,
      [InputName.STUDENT_PARTNER_ORG_SITE_NAME]: data.studentPartnerOrgSiteName,
      [InputName.ZIP_CODE]: data.zipCode,
    })
    window.localStorage.removeItem('upcReferredByCode')
    AnalyticsService.captureGoogleAnalyticsEvent('student_sign_up')

    return getSubmitResponse(
      data.parent ? SignUpPage.parentGuardianConfirmation : SignUpPage.verify,
      data
    )
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

function createAccountWithProvider(
  provider: SsoProvider,
  data: StudentAccountFormData
) {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CREATE_ACCOUNT, {
    provider,
  })
  return SignUpService.createAccountWithProvider(
    provider,
    UserType.student,
    data
  )
}

function createAccountWithGoogle(data: StudentAccountFormData) {
  return createAccountWithProvider(SsoProvider.GOOGLE, data)
}

export function createAccountWithClever(data: StudentAccountFormData) {
  return createAccountWithProvider(SsoProvider.CLEVER, data)
}

export function createAccountWithClassLink(data: StudentAccountFormData) {
  return createAccountWithProvider(SsoProvider.CLASSLINK, data)
}

function getParentGuardianConfirmationDetails(
  to: RouteLocation
): PageDetail<ParentGuardianReset> {
  function resetSignUp(data: ParentGuardianReset) {
    return getSubmitResponse(SignUpPage.eligibility, {
      ...data,
      // If a parent/guardian wants to add another child,
      // reset only the parts of the form specific
      // to that child they just added.
      // @ts-expect-error todo - maybe update types to include optional reset
      reset: [
        'email',
        'firstName',
        'lastName',
        'schoolId',
        'gradeLevel',
        'signupSourceId',
      ],
    })
  }

  const studentEmail = to.params.email
  return {
    backgroundLayout: 'full',
    classes: 'text-center screen-narrow',
    submitAction: resetSignUp,
    rows: [
      getRow(
        'justify-center',
        getTextElement(
          'h1',
          'Your child should have received an email from us!'
        )
      ),
      getRow('justify-center mt-3', {
        element: 'updog-smiling',
        classes: 'updog',
      }),
      getRow('justify-center mt-3', {
        element: 'check-circled',
      }),
      getRow(
        'justify-center mt-3 pre-wrap',
        getTextElement(
          'p',
          `Please confirm with your child that they in fact did receive an email from us.\nEmail was sent to ${studentEmail}.`
        )
      ),
      getRow(
        'justify-center bold mt-3',
        getTextElement('p', "My child didn't receive a sign up email."),
        getRouterLinkElement('Contact Us', '/contact')
      ),
      getRow(
        'justify-center',
        getButtonElement(resetSignUp, 'Sign up another child', 'button-narrow')
      ),
    ],
  }
}

function getStudentEmailElement(
  isParentGuardian: boolean = false
): FormElement {
  return {
    element: 'FormEmail',
    props: {
      name: InputName.EMAIL,
      label: getLabelPrefix(isParentGuardian) + 'Email',
      placeholder: getLabelPrefix(isParentGuardian) + 'Email',
      blurEvent: EVENTS.STUDENT_ENTERED_EMAIL,
    },
  }
}

function getParentGuardianEmailElement(): FormElement {
  return {
    element: 'FormEmail',
    props: {
      name: InputName.PARENT_GUARDIAN_EMAIL,
      label: 'Your Email',
      placeholder: 'Your Email',
    },
  }
}

function getZipCodeElement(): FormElement {
  return {
    element: 'FormInput',
    props: {
      name: InputName.ZIP_CODE,
      label: 'Zip Code',
      placeholder: 'Zip Code',
      minLength: 5,
      maxLength: 5,
      blurEvent: EVENTS.STUDENT_ENTERED_ZIP_CODE,
    },
  }
}

function getGradeSelectionElement(isParentGuardian: boolean): FormElement {
  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_GRADE,
      options: GRADES,
      name: InputName.GRADE_LEVEL,
      label: getLabelPrefix(isParentGuardian) + 'Grade in 2025-2026',
      placeholder: getLabelPrefix(isParentGuardian) + 'Grade in 2025-2026',
      isRequired: true,
      reduce: (option: string) => option.split(' ')[0],
    },
  }
}

function getSsoSectionElements(): FormRow[] {
  const isMobileMode = store.getters['app/mobileMode']
  const isClassLinkSsoEnabled =
    store.getters['featureFlags/isClassLinkSsoEnabled']
  const rows: FormRow[] = []

  if (!isMobileMode)
    rows.push(
      getRow(
        'mt-4',
        getSsoButton(createAccountWithGoogle, 'Google', SsoProvider.GOOGLE),
        getSsoButton(createAccountWithClever, 'Clever', SsoProvider.CLEVER),
        isClassLinkSsoEnabled
          ? getSsoButton(
              createAccountWithClassLink,
              'ClassLink',
              SsoProvider.CLASSLINK
            )
          : undefined
      )
    )
  else {
    rows.push(
      getRow(
        'mt-4',
        getSsoButton(createAccountWithGoogle, 'Google', SsoProvider.GOOGLE)
      ),
      getRow(
        'mt-3',
        getSsoButton(createAccountWithClever, 'Clever', SsoProvider.CLEVER)
      )
    )

    if (isClassLinkSsoEnabled)
      rows.push(
        getRow(
          'mt-3',
          getSsoButton(
            createAccountWithClassLink,
            'ClassLink',
            SsoProvider.CLASSLINK
          )
        )
      )
  }
  rows.push(
    getRow(
      'justify-center italic mt-3',
      getTextElement(
        'p',
        'By clicking the button above, you agree to our User Agreement'
      )
    ),
    getRow('mt-2 mb-2', { element: 'LineDivider', props: { text: 'or' } })
  )
  return rows
}

function getPartnerSitesElement(to: RouteLocation): FormElement | undefined {
  const sites = to.params.studentPartnerSites
  if (!sites || !sites.length) {
    return
  }

  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_PARTNER_SITE,
      getSelectOptions: () => sites,
      name: InputName.STUDENT_PARTNER_ORG_SITE_NAME,
      label: 'Site',
      placeholder: 'Site',
    },
  }
}

function getTermsCheckboxElements() {
  return [
    getRow(
      'justify-start mt-4 el-gap-sm',
      {
        element: 'FormCheckBox',
        props: {
          label: 'I have read and accept the',
          name: InputName.TERMS,
        },
      },
      {
        element: 'a',
        classes: 'uc-link',
        content: 'User Agreement.',
        props: {
          href: 'https://upchieve.org/legal',
          target: '_blank',
        },
      }
    ),
  ]
}

export async function beforeEnter(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (
    // Students must start from the eligibility page,
    // unless it is an error redirect or we have been redirected to
    // the international page (after checking IP).
    to.params.step !== 'eligibility' &&
    !(to.params.step === 'international' && to.redirectedFrom?.params.step) &&
    !from.name &&
    !to.query.error
  ) {
    return next({
      name: 'SignupView',
      params: { step: 'eligibility', userType: to.params.userType },
      query: to.query,
    })
  }

  if (to.query.classCode) {
    to.params.classCode = to.query.classCode as string
    to.params.email = to.query.email as string
    to.params.gradeLevel = to.query.gradeLevel as string
    delete to.query.classCode
    delete to.query.email
    delete to.query.gradeLevel
  }

  const isParent = Object.keys(to.query ?? {}).some(
    (key) => key.trim() === 'parent'
  )
  if (isParent) {
    // Needed for legacy data sanitation.
    to.params.parent = 'true'
  }

  const partnerKey = to.query?.partner as string
  if (partnerKey) {
    try {
      const {
        data: { studentPartner },
      } = await NetworkService.getStudentPartner(partnerKey)
      if (!studentPartner || studentPartner.deactivated) {
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_VISITED_DEACTIVATED_PARTNER,
          { partner: to.query.partner }
        )
        delete to.query.partner
        return next({
          path: to.path,
          query: to.query,
          params: to.params,
        } as RouteLocationRaw)
      } else {
        to.params.partner = studentPartner
        to.params.studentPartnerOrgKey = studentPartner.key
        to.params.studentPartnerName = studentPartner.name
        to.params.studentPartnerSites = studentPartner.sites
        to.params.studentPartnerIsSchool = studentPartner.isSchool.toString()
        to.params.schoolSignupRequired =
          studentPartner.schoolSignupRequired.toString()
      }
    } catch (err) {
      // TODO: Don't throw an error if a partner with the key does not exist.
      if ((err as NetworkError).status !== 422) {
        LoggerService.noticeError(err)
      }
      delete to.query.partner
      return next({
        path: to.path,
        query: to.query,
        params: to.params,
      } as RouteLocationRaw)
    }
  } else if (to.params.step !== 'international') {
    try {
      await NetworkService.checkIpAddress()
    } catch {
      // TODO: Don't throw an error if the student is not in the US.
      return next({
        name: 'SignupView',
        params: { step: 'international', userType: to.params.userType },
      })
    }
  }

  return next()
}

// Exported for testing.
export const __test__ = {
  getEligibilityPageDetails,
  getIneligiblePageDetails,
  getAccountPageDetails,
  checkEligibility,
  ineligibleContinue,
  createAccount,
}
