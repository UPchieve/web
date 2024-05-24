import config from '@/config'
import { EVENTS, GRADES } from '@/consts'
import store from '@/store'
import AnalyticsService from '@/services/AnalyticsService'
import AuthService from '@/services/AuthService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { getFormAddressee, getLabelPrefix } from '@/utils/signup-utils'

const RoutePath = {
  account: '/sign-up/student/account',
  eligibility: '/sign-up/student/eligibility',
  ineligible: '/sign-up/student/ineligible',
  parentGuardianConfirmation: '/sign-up/student/confirmation',
  partnerInfo: 'sign-up/student/info',
  verify: '/verify',
}
const SignUpPage = {
  account: 'account',
  eligibility: 'eligibility',
  ineligible: 'ineligible',
  parentGuardianConfirmation: 'confirmation',
  partnerInfo: 'info',
  verify: 'verify',
}
/*
TypeScript will be nice :)
In the meantime, here are the pseudo types:
type PageDetail = {
  backgroundLayout: 'card' | 'panel-right-50p' etc.,
  submitAction: (fd: FormData) => string[],
  classes: string,
  rows: [
    classes: string,
    elements: {
      element: FormElement,
      classes: string,
      content: string,
      submitAction: (fd: FormData) => SubmitActionResponse,
      props: {
        name: InputName
        ...etc
      }
    }[],
}
type FormElement = 'h1' | 'p' | 'FormSelect' | 'FormInput' | 'FormEmail' etc.
type SubmitActionResponse = [valid router object, error]
*/

// The following values are used as the `name` attribute on form elements,
// and should match the keys in server requests.
export const InputName = {
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
  ZIP_CODE: 'zipCode',
}

export function getPageDetails(to, from) {
  const pd = get(to, from)
  pd.rows = pd.rows.filter((row) => !!row)
  return pd

  function get() {
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
  }
}

async function checkEligibility(data) {
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

async function continueToAccountPage(data) {
  return getSubmitResponse(SignUpPage.account, data)
}

async function createAccount(data) {
  try {
    await AuthService.registerStudent({
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

function createAccountWithSso(provider, data) {
  try {
    const params = new URLSearchParams({
      provider,
    })
    for (const key of Object.keys(data)) {
      if (data[key]) params.append(key, data[key])
    }
    const url = `${config.serverRoot}/auth/sso?${params.toString()}`
    window.location.replace(url)
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

function ineligibleContinue() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_STUDENT_ACCESS_PAGE)
  window.location = 'https://upchieve.org/request-access'
}

function getSubmitResponse(nextPage, data, err) {
  if (err) {
    const error =
      typeof err === 'string'
        ? error
        : err.response?.data?.err ?? 'Failed: Please try again.'
    return [null, error]
  }

  switch (nextPage) {
    case SignUpPage.eligibility:
      return [
        {
          params: {
            userType: 'student',
            step: SignUpPage.eligibility,
          },
          query: {
            parent: data.parent,
            partner: data.partner?.key,
          },
        },
        null,
      ]
    case SignUpPage.account:
      return [
        {
          params: {
            ...data,
            userType: 'student',
            step: SignUpPage.account,
          },
        },
        null,
      ]
    case SignUpPage.ineligible:
      return [
        {
          params: {
            userType: 'student',
            step: SignUpPage.ineligible,
          },
        },
        null,
      ]
    case SignUpPage.verify:
      return [{ path: RoutePath.verify }, null]
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
  }
}

function getRow(classes = '', ...elements) {
  return {
    classes,
    elements: elements.filter((e) => !!e),
  }
}

function getTextElement(element, content) {
  return {
    element,
    content,
  }
}

function getButtonElement(submitAction, content, classes = '') {
  return {
    element: 'button',
    classes: 'uc-form-button ' + classes,
    content,
    isDisabledOnInvalid: true,
    submitAction,
  }
}

function getRouterLinkElement(content, pathTo) {
  return {
    element: 'router-link',
    classes: 'uc-link ml-1',
    content: content,
    props: {
      to: pathTo,
    },
  }
}

function getSsoButton(submitAction, content, ssoMethod = 'google') {
  return {
    element: 'SsoButton',
    submitAction,
    props: {
      buttonText: content,
      ssoMethod,
    },
  }
}

function getAlreadyHaveAccountElements() {
  return [
    getTextElement('p', 'Already have an account?'),
    getRouterLinkElement('Log in', '/login'),
  ]
}

function getInputElement(name, prettyName, blurEvent) {
  return {
    element: 'FormInput',
    props: {
      blurEvent,
      name,
      label: prettyName,
      placeholder: prettyName,
    },
  }
}

function getZipCodeElement() {
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

function getGradeSelectionElement(isParentGuardian) {
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

function getPartnerSitesElement(to) {
  const sites = to.params.partner?.sites
  if (!sites) {
    return
  }

  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_PARTNER_SITE,
      getSelectOptions: () => sites,
      name: 'partnerOrgSiteName',
      label: 'Site',
      placeholder: 'Site',
    },
  }
}

function getSignUpSourceElement() {
  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_HOW_DID_YOU_HEAR_ABOUT_US,
      getSelectOptions: async function () {
        try {
          const {
            data: { signupSources },
          } = await NetworkService.getStudentSignupSources()
          return signupSources
        } catch (err) {
          LoggerService.noticeError(err)
          return []
        }
      },
      label: 'How did you hear about us?',
      name: InputName.SIGNUP_SOURCE_ID,
      optionTextField: 'name',
      placeholder: 'How did you hear about us?',
      reduce: (option) => option.id,
    },
  }
}

function getStudentEmailElement(isParentGuardian) {
  return {
    element: 'FormEmail',
    props: {
      name: InputName.EMAIL,
      label: getLabelPrefix(isParentGuardian) + 'Email',
      placeholder: getLabelPrefix(isParentGuardian) + 'Email',
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

function getSsoSectionElements() {
  return [
    getRow(null, getSsoButton(createAccountWithGoogle, 'Google')),
    getRow(null, getSsoButton(createAccountWithClever, 'Clever', 'clever')),
    getRow(null, { element: 'LineDivider', props: { text: 'or' } }),
  ]
}

function isIneligibleRoute(to) {
  return to.path === RoutePath.ineligible
}

function isAccountRoute(to) {
  return to.path === RoutePath.account
}

function isParentGuardianConfirmationRoute(to, from) {
  return (
    to.path === RoutePath.parentGuardianConfirmation &&
    from?.path === RoutePath.account
  )
}

function isParentGuardianSignUp(to) {
  return to.params.parent
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
    rows: [
      getRow(null, getTextElement('h1', getHeaderText())),
      subheaderText ? getRow(null, getTextElement('p', subheaderText)) : null,
      isPartnerStudentSignUp()
        ? getRow(
            'justify-start',
            getRouterLinkElement(
              `Not with ${to.params.partner?.name}?`,
              '/sign-up/student/eligibility'
            )
          )
        : getRow('justify-start', ...getAlreadyHaveAccountElements()),
      isPartnerStudentSignUp()
        ? getRow(null, getPartnerSitesElement(to))
        : null,
      getRow(
        null,
        getGradeSelectionElement(isParentGuardian),
        isEligibilitySignUp() ? getZipCodeElement() : null
      ),
      includeSchoolElement()
        ? getRow(null, {
            element: 'FormSchoolSearch',
            props: {
              label: getLabelPrefix(isParentGuardian) + 'School Name',
              placeholder: getLabelPrefix(isParentGuardian) + 'School Name',
              isRequired: isSchoolRequired(),
            },
          })
        : null,
      isOrganicStudentSignUp() || isEligibilityAppealSignUp()
        ? getRow(null, getSignUpSourceElement())
        : null,
      getRow(null, { element: 'br' }),
      getRow(
        null,
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
      getRow(
        'justify-center',
        getTextElement('h1', "Oops... looks like you're not eligible")
      ),
      getRow(
        null,
        getTextElement(
          'p',
          "While we weren't able to verify your eligibility based on the info provided, don't worry: you may still be eligible! We just need your parent/guardian to answer some more questions first!"
        )
      ),
      getRow(
        'justify-center',
        getButtonElement(ineligibleContinue, 'Continue', 'button-narrow')
      ),
    ],
  }
}

function getAccountPageDetails(to) {
  const isParentGuardian = isParentGuardianSignUp(to)
  return {
    backgroundLayout: 'panel-right-75p',
    submitAction: createAccount,
    rows: [
      getRow(
        getTextElement(
          'h1',
          (isParentGuardian ? 'Your child is ' : "You're ") +
            'eligible for UPchieve! 🎉'
        )
      ),
      getRow(null, getTextElement('h2', 'Create an Account')),
      ...(!isParentGuardian ? getSsoSectionElements() : []),
      isParentGuardian ? getRow(null, getParentGuardianEmailElement(to)) : null,
      getRow(
        null,
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
      getRow(null, getStudentEmailElement(to)),
      !isParentGuardian ? getRow(null, {
        element: 'FormPassword',
        props: {
          name: InputName.PASSWORD,
          metadata:
            'Must have at least one number, one uppercase letter, one lowercase letter, and be at least 8 characters long.',
        },
      }) : null,
      // TODO: getRow(null, getTermsCheckbox()),
      getRow(
        'items-baseline',
        ...getAlreadyHaveAccountElements(),
        getButtonElement(createAccount, 'Confirm', 'button-narrow ml-auto')
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
