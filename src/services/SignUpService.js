import config from '@/config'
import { EVENTS, GRADES } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import AuthService from '@/services/AuthService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { getFormAddressee } from '@/utils/signup-utils'

const RoutePath = {
  account: '/sign-up/student/account',
  eligibility: '/sign-up/student/eligibility',
  ineligible: '/sign-up/student/ineligible',
  verify: '/verify',
}
const SignUpPage = {
  account: 'account',
  eligibility: 'eligibility',
  ineligible: 'ineligible',
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

    return getEligibilityPageDetails(to)
  }
}

async function checkEligibility(data) {
  try {
    const {
      data: { isEligible },
    } = await NetworkService.checkStudentEligibility({
      [InputName.EMAIL]: '',
      [InputName.GRADE_LEVEL]: data[InputName.GRADE_LEVEL],
      [InputName.REFERRED_BY_CODE]: window.localStorage.getItem(
        InputName.REFERRED_BY_CODE
      ),
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

async function createAccount(data) {
  try {
    await AuthService.registerStudent({
      [InputName.EMAIL]: data[InputName.EMAIL],
      [InputName.FIRST_NAME]: data[InputName.FIRST_NAME],
      [InputName.GRADE_LEVEL]: data[InputName.GRADE_LEVEL],
      [InputName.LAST_NAME]: data[InputName.LAST_NAME],
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

    return getSubmitResponse(SignUpPage.verify)
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
  }
}

function getRow(classes = '', ...elements) {
  return {
    classes,
    elements,
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
    {
      element: 'router-link',
      classes: 'uc-link ml-1',
      content: 'Log In',
      props: {
        to: '/login',
      },
    },
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

function getGradeSelectionElement() {
  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_GRADE,
      getSelectOptions: () => GRADES,
      name: InputName.GRADE_LEVEL,
      label: 'Grade in 2023-2024',
      placeholder: 'Grade in 2023-2024',
      reduce: (option) => option.split(' ')[0],
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

function getStudentEmailElement(to) {
  return {
    element: 'FormEmail',
    props: {
      name: InputName.EMAIL,
      label: isParentGuardianSignUp(to) ? "Student's Email" : 'Email',
      placeholder: isParentGuardianSignUp(to) ? "Student's Email" : 'Email',
    },
  }
}

function isIneligibleRoute(to) {
  return to.path === RoutePath.ineligible
}

function isAccountRoute(to, from) {
  return to.path === RoutePath.account && from?.path === RoutePath.eligibility
}

function isParentGuardianSignUp(to) {
  return Object.keys(to.query ?? {}).some((key) => key.trim() === 'parent')
}

function getEligibilityPageDetails(to) {
  function getHeaderText() {
    if (to.params.partner?.name) {
      if (isCodeDotOrgStudent()) {
        return 'Welcome to UPchieve!'
      }
      return `Welcome ${to.params.partner.name} ${getFormAddressee(isParentGuardianSignUp(to))}`
    }

    return 'Check if you are eligible for UPchieve'
  }

  function isCodeDotOrgStudent() {
    return to.params.partner?.key === 'code-org'
  }

  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    rows: [
      getRow(null, getTextElement('h1', getHeaderText())),
      isCodeDotOrgStudent()
        ? getRow(
            null,
            getTextElement(
              'p',
              'Create an account now to access FREE, 24/7 tutoring in all your classes, including AP Computer Science.'
            )
          )
        : null,
      getRow('justify-start', ...getAlreadyHaveAccountElements()),
      getRow(null, getGradeSelectionElement(), getZipCodeElement()),
      getRow(null, {
        element: 'FormSchoolSearch',
        props: { name: InputName.SCHOOL_ID },
      }),
      getRow(null, getSignUpSourceElement()),
      getRow(null, { element: 'br' }),
      getRow(null, getButtonElement(checkEligibility, 'Check eligibility')),
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
        classes: 'updog-crying',
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
  return {
    backgroundLayout: 'panel-right-75p',
    submitAction: createAccount,
    rows: [
      getRow(null, getTextElement('h1', "You're eligible for UPchieve! 🎉")),
      getRow(null, getTextElement('h2', 'Create an Account')),
      getRow(
        null,
        getSsoButton(createAccountWithGoogle, 'Continue with Google')
      ),
      getRow(
        null,
        getSsoButton(createAccountWithClever, 'Continue with Clever', 'clever')
      ),
      getRow(null, { element: 'LineDivider', props: { text: 'or' } }),
      getRow(
        null,
        getInputElement(
          InputName.FIRST_NAME,
          'First Name',
          EVENTS.STUDENT_ENTERED_FIRST_NAME
        ),
        getInputElement(
          InputName.LAST_NAME,
          'Last Name',
          EVENTS.STUDENT_ENTERED_LAST_NAME
        )
      ),
      getRow(null, getStudentEmailElement(to)),
      getRow(null, { element: 'FormPassword' }),
      // TODO: getRow(null, getTermsCheckbox()),
      getRow(
        'items-baseline',
        ...getAlreadyHaveAccountElements(),
        getButtonElement(createAccount, 'Confirm', 'button-narrow ml-auto')
      ),
    ],
  }
}
