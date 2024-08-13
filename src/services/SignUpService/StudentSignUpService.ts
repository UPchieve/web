import store from '@/store'
import { GRADES, EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import AuthService from '@/services/AuthService'
import {
  UserType,
  SignUpPage,
  getFilteredPageDetails,
  getSubmitResponseDefault,
  continueToAccountPage,
  createAccountWithSso,
  getRow,
  getTextElement,
  getButtonElement,
  getRouterLinkElement,
  getSsoButton,
  getAlreadyHaveAccountElements,
  getSignUpSourceElement,
  getInputElement,
} from '@/services/SignUpService'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { getFormAddressee, getLabelPrefix } from '@/utils/signup-utils'

const RoutePath = {
  account: `/sign-up/student/${SignUpPage.account}`,
  eligibility: `/sign-up/student/${SignUpPage.eligibility}`,
  ineligible: `/sign-up/student/${SignUpPage.ineligible}`,
  parentGuardianConfirmation: `/sign-up/student/${SignUpPage.confirmation}`,
  partnerInfo: `sign-up/student/${SignUpPage.info}`,
  verify: `/${SignUpPage.verify}`,
}
// The following values are used as the `name` attribute on form elements,
// and should match the keys in server requests.
export const InputName = {
  CLASS_CODE: 'classCode',
  EMAIL: 'email',
  FIRST_NAME: 'firstName',
  GRADE_LEVEL: 'gradeLevel',
  LAST_NAME: 'lastName',
  PARENT_GUARDIAN_EMAIL: 'parentGuardianEmail',
  PASSWORD: 'password',
  REFERRED_BY_CODE: 'upcReferredByCode',
  SCHOOL_ID: 'schoolId',
  SIGNUP_SOURCE_ID: 'signupSourceId',
  STUDENT_PARTNER_ORG_KEY: 'studentPartnerOrgKey',
  STUDENT_PARTNER_ORG_SITE_NAME: 'studentPartnerOrgSiteName',
  TERMS: 'terms',
  ZIP_CODE: 'zipCode',
}

export function getPageDetails(to, from) {
  return getFilteredPageDetails(() => {
    if (isIneligibleRoute(to, from)) {
      return getIneligiblePageDetails()
    }

    if (isAccountRoute(to, from)) {
      return getAccountPageDetails(to)
    }

    if (isParentGuardianConfirmationRoute(to, from)) {
      return getParentGuardianConfirmationDetails(to)
    }

    return getFirstPageDetails(to)
  })
}

function getSubmitResponse(nextPage, data, err) {
  switch (nextPage) {
    case SignUpPage.eligibility:
      return [
        {
          params: {
            userType: UserType.student,
            step: SignUpPage.eligibility,
          },
          query: {
            parent: data.parent,
            partner: data.partner?.key,
          },
        },
        null,
      ]
    case SignUpPage.parentGuardianConfirmation:
      return [
        {
          params: {
            ...data,
            step: SignUpPage.parentGuardianConfirmation,
          },
        },
        null,
      ]
    default:
      return getSubmitResponseDefault(nextPage, data, err)
  }
}

async function checkEligibility(data) {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY, {
    partnerKey: data.partner?.key,
  })
  try {
    const {
      data: { isEligible },
    } = await NetworkService.checkStudentEligibility({
      [InputName.EMAIL]: '',
      [InputName.GRADE_LEVEL]: data[InputName.GRADE_LEVEL],
      [InputName.REFERRED_BY_CODE]:
        window.localStorage.getItem('upcReferredByCode'),
      [InputName.SCHOOL_ID]: data[InputName.SCHOOL_ID],
      [InputName.ZIP_CODE]: data[InputName.ZIP_CODE],
    })
    AnalyticsService.captureEvent(
      isEligible ? EVENTS.ELIGIBILITY_ELIGIBLE : EVENTS.ELIGIBILITY_INELIGIBLE,
      { partnerKey: data.partner?.key }
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

function ineligibleContinue() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_STUDENT_ACCESS_PAGE)
  window.location = 'https://upchieve.org/request-access'
  return [null, null]
}

async function createAccount(data) {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CREATE_ACCOUNT)
  try {
    await AuthService.registerStudent({
      [InputName.CLASS_CODE]: data[InputName.CLASS_CODE],
      [InputName.EMAIL]: data[InputName.EMAIL],
      [InputName.FIRST_NAME]: data[InputName.FIRST_NAME],
      [InputName.GRADE_LEVEL]: data[InputName.GRADE_LEVEL],
      [InputName.LAST_NAME]: data[InputName.LAST_NAME],
      [InputName.PARENT_GUARDIAN_EMAIL]: data[InputName.PARENT_GUARDIAN_EMAIL],
      [InputName.PASSWORD]: data[InputName.PASSWORD],
      [InputName.REFERRED_BY_CODE]:
        window.localStorage.getItem('upcReferredByCode'),
      [InputName.SCHOOL_ID]: data[InputName.SCHOOL_ID],
      [InputName.SIGNUP_SOURCE_ID]: data[InputName.SIGNUP_SOURCE_ID],
      [InputName.STUDENT_PARTNER_ORG_KEY]:
        data[InputName.STUDENT_PARTNER_ORG_KEY],
      [InputName.STUDENT_PARTNER_ORG_SITE_NAME]:
        data[InputName.STUDENT_PARTNER_ORG_SITE_NAME],
      [InputName.ZIP_CODE]: data[InputName.ZIP_CODE],
    })
    window.localStorage.removeItem('upcReferredByCode')

    return getSubmitResponse(
      data.parent ? SignUpPage.parentGuardianConfirmation : SignUpPage.verify,
      data
    )
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

function createAccountWithGoogle(data) {
  AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_GOOGLE)
  return createAccountWithSso('google', data)
}

function createAccountWithClever(data) {
  AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_CLEVER)
  return createAccountWithSso('clever', data)
}

function isParentGuardianSignUp(to) {
  return to.params.parent === true || to.params.parent === 'true'
}

function isIneligibleRoute(to) {
  return to.path === RoutePath.ineligible
}

function isAccountRoute(to, from) {
  return to.path === RoutePath.account
}

function isParentGuardianConfirmationRoute(to, from) {
  return (
    to.path === SignUpPage.parentGuardianConfirmation &&
    from?.path === SignUpPage.account
  )
}

function getStudentEmailElement(isParentGuardian) {
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

function getParentGuardianEmailElement() {
  return {
    element: 'FormEmail',
    props: {
      name: InputName.PARENT_GUARDIAN_EMAIL,
      label: 'Your Email',
      placeholder: 'Your Email',
    },
  }
}

export function getZipCodeElement() {
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

export function getGradeSelectionElement(isParentGuardian) {
  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_GRADE,
      getSelectOptions: () => GRADES,
      name: InputName.GRADE_LEVEL,
      label: getLabelPrefix(isParentGuardian) + 'Grade in 2023-2024',
      placeholder: getLabelPrefix(isParentGuardian) + 'Grade in 2023-2024',
      reduce: (option) => option.split(' ')[0],
    },
  }
}

function getSsoSectionElements() {
  return [
    getRow('mt-4', getSsoButton(createAccountWithGoogle, 'Google')),
    getRow('mt-3', getSsoButton(createAccountWithClever, 'Clever', 'clever')),
    getRow(
      'justify-center italic mt-3',
      getTextElement(
        'p',
        'By clicking the button above, you agree to our User Agreement'
      )
    ),
    getRow('mt-2 mb-2', { element: 'LineDivider', props: { text: 'or' } }),
  ]
}

export function getPartnerSitesElement(to) {
  const sites = to.params.partner?.sites
  if (!sites) {
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

export function getTermsCheckboxElements() {
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

function getFirstPageDetails(to) {
  function isEligibilitySignUp() {
    return to.params.step === 'eligibility'
  }
  function isEligibilityAppealSignUp() {
    return to.params.partner?.isManuallyApproved
  }
  function isOrganicStudentSignUp() {
    return !to.params.partner
  }
  function isPartnerStudentSignUp() {
    return to.params.partner
  }
  function isCodeDotOrgStudent() {
    return to.params.partner?.key === 'code-org'
  }
  function isBigFutureStudent() {
    return to.params.partner?.key === 'bigfuture'
  }
  function isCollegeConfidentialStudent() {
    return to.params['utm_source'] === 'collegeconfidential'
  }

  function getHeaderText() {
    if (isParentGuardianSignUp(to)) {
      return 'Check if your child is eligible for free tutoring with UPchieve'
    }
    if (isCodeDotOrgStudent()) {
      return 'Welcome to UPchieve!'
    }
    if (isCollegeConfidentialStudent()) {
      return `Get that A you deserve!`
    }
    const partnerName = to.params.partner?.name
    if (partnerName) {
      return `Welcome ${partnerName} ${getFormAddressee(isParentGuardianSignUp(to))}!`
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
  }

  function includeSchoolElement() {
    if (isPartnerStudentSignUp()) {
      return !to.params.partner.isSchool
    }
    return true
  }

  function isSchoolRequired() {
    if (isPartnerStudentSignUp()) {
      return to.params.partner.schoolSignupRequired
    }
    return true
  }

  const isParentGuardian = isParentGuardianSignUp(to)
  const subheaderText = getSubheaderText()
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    panelImage: 'chat-one-on-one',
    classes: 'uc-column justify-center justify-start-md',
    rows: [
      getRow(
        'justify-center',
        {
          element: 'header-logo-teal',
        }
      ),
      getRow('mt-4', getTextElement('h1', getHeaderText())),
      subheaderText ? getRow('mt-3', getTextElement('p', subheaderText)) : null,
      isPartnerStudentSignUp()
        ? getRow(
          'justify-start mt-1',
          getRouterLinkElement(
            `Not with ${to.params.partner?.name}?`,
            '/sign-up/student/eligibility'
          )
        )
        : getRow('justify-start mt-1 el-gap-sm', ...getAlreadyHaveAccountElements()),
      isPartnerStudentSignUp()
        ? getRow('mt-2', getPartnerSitesElement(to))
        : null,
      getRow(
        'mt-2',
        getGradeSelectionElement(isParentGuardian),
        isEligibilitySignUp() ? getZipCodeElement() : null
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
            ].includes(form[InputName.GRADE_LEVEL])
          },
        })
        : null,
      isOrganicStudentSignUp() || isEligibilityAppealSignUp()
        ? getRow('mt-2', getSignUpSourceElement(InputName.SIGNUP_SOURCE_ID, EVENTS.STUDENT_SELECTED_HOW_DID_YOUR_HEAR_ABOUT_US))
        : null,
      getRow(
        'mt-4',
        isEligibilitySignUp()
          ? getButtonElement(checkEligibility, 'Check eligibility')
          : getButtonElement(continueToAccountPage, 'Continue')
      ),
    ],
  }
}

function getIneligiblePageDetails() {
  return {
    backgroundLayout: 'full',
    submitAction: ineligibleContinue,
    classes: 'text-center screen-narrow',
    rows: [
      getRow('uc-row justify-center', {
        element: 'updog-crying',
        classes: 'updog',
      }),
      getRow('justify-center center mt-4', getTextElement('h1', "Oops... looks like you're not eligible")),
      getRow('justify-center center mt-3', getTextElement('p', "While we weren't able to verify your eligibility based on the info provided, don't worry: you may still be eligible! We just need your parent/guardian to answer some more questions first!")),
      getRow('justify-center mt-3', getButtonElement(ineligibleContinue, 'Continue', 'button-narrow', false)),
    ],
  }
}

function getAccountPageDetails(to) {
  const isParentGuardian = isParentGuardianSignUp(to)
  const isClassCodeSignUp = !!to.params.classCode

  function getH1Text() {
    if (isClassCodeSignUp) {
      return `You're almost done! 🎉`
    }

    const prefixIdentifier =  isParentGuardian ? 'Your child is ' : "You're "
    return prefixIdentifier + 'eligible for UPchieve! 🎉'
  }
  function getH2Text() {
    const suffix = ` to join class ${to.params.classCode}`
    return 'Finish creating your account' + suffix
}

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
      getRow('mt-4', getTextElement('h1', getH1Text())),
      getRow('mt-3', getTextElement('h2', getH2Text())),
      ...(!isParentGuardian ? getSsoSectionElements() : []),
      isParentGuardian ? getRow('mt-2', getParentGuardianEmailElement(to)) : null,
      getRow(
        'mt-2 uc-column-sm',
        getInputElement(
          InputName.FIRST_NAME,
          'First Name',
          getLabelPrefix(isParentGuardian) + 'First Name',
          EVENTS.STUDENT_ENTERED_FIRST_NAME
        ),
        getInputElement(
          InputName.LAST_NAME,
          'Last Name',
          getLabelPrefix(isParentGuardian) + 'Last Name',
          EVENTS.STUDENT_ENTERED_LAST_NAME
        )
      ),
      !isClassCodeSignUp ? getRow('mt-2', getStudentEmailElement(isParentGuardian)) : null,
      !isParentGuardian
        ? getRow('mt-2', {
          element: 'FormPassword',
          props: {
            name: InputName.PASSWORD,
            metadata:
              'Must have at least one number, one uppercase letter, one lowercase letter, and be at least 8 characters long.',
            blurEvent: EVENTS.STUDENT_ENTERED_PASSWORD,
          },
        })
        : null,
      ...getTermsCheckboxElements(),
      getRow(
        'justify-end mt-4',
        getButtonElement(createAccount, 'Confirm', 'button-narrow')
      ),
    ],
  }
}

function getParentGuardianConfirmationDetails(to) {
  function resetSignUp(data) {
    return getSubmitResponse(SignUpPage.eligibility, data)
  }

  const studentEmail = to.params.studentEmail
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
      getRow('justify-center', {
        element: 'updog-smiling',
        classes: 'updog',
      }),
      getRow('justify-center', {
        element: 'check-circled',
      }),
      getRow(
        'justify-center',
        getTextElement(
          'p',
          `Please confirm with your child that they in fact did receive an email from us. Email was sent to ${studentEmail}.`
        )
      ),
      getRow(
        'justify-center bold',
        getTextElement('p', "My child didn't receive a sign up email."),
        getRouterLinkElement('Resend email', '') // TODO: Need a new endpoint.
      ),
      getRow(
        'justify-center',
        getButtonElement(resetSignUp, 'Sign up another child', 'button-narrow')
      ),
    ],
  }
}

export async function beforeEnter(to, from, next) {
  if (
    // Students must start from one of the form first pages,
    // unless it is an error redirect.
    !['eligibility', 'info'].includes(to.params.step) &&
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
    to.params.classCode = to.query.classCode
    to.params.email = to.query.email
    to.params.gradeLevel = to.query.gradeLevel
    delete to.query.classCode
    delete to.query.email
    delete to.query.gradeLevel
  }

  const isParent = Object.keys(to.query ?? {}).some(
    (key) => key.trim() === 'parent'
  )
  to.params.parent = isParent

  const partnerKey = to.query?.partner
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
        return next({ path: to.path, query: to.query, params: to.params })
      } else {
        to.params.partner = studentPartner
        to.params[InputName.STUDENT_PARTNER_ORG_KEY] = studentPartner.key
      }
    } catch (err) {
      // TODO: Don't throw an error if a partner with the key does not exist.
      if (err.response.status !== 422) {
        LoggerService.noticeError(err)
      }
      delete to.query.partner
      return next({ path: to.path, query: to.query, params: to.params })
    }
  }

  return next()
}
