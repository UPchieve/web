import { EVENTS } from '@/consts'
import router from '@/router'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { SsoProvider, signInWithSso } from '@/services/SsoService'
import type {
  StudentAccountFormData,
  StudentSignUpFormData,
} from './StudentSignUpService'
import type {
  TeacherAccountFormData,
  TeacherSignUpFormData,
} from './TeacherSignUpService'

export enum SignUpPage {
  account = 'account',
  eligibility = 'eligibility',
  ineligible = 'ineligible',
  parentGuardianConfirmation = 'confirmation',
  partnerInfo = 'info',
  verify = 'verify',
}

export enum UserType {
  student = 'student',
  teacher = 'teacher',
  volunteer = 'volunteer',
}

export type SignUpFormData = StudentSignUpFormData | TeacherSignUpFormData
type AccountFormData = StudentAccountFormData | TeacherAccountFormData

/**
Create a union of all the PageDetail. So, for example,
`PageDetailsUnion<SignUpFormData>` becomes
`PageDetail<StudentSignUpFormData> | PageDetail<TeacherSignUpFormdata> | ...`
*/
export type PageDetailsUnion<T> = T extends SignUpFormData
  ? PageDetail<T>
  : never
export type PageDetail<T extends SignUpFormData> = {
  backgroundLayout?:
    | 'full'
    | 'card'
    | 'panel-left-50p'
    | 'panel-left-75p'
    | 'panel-right-50p'
    | 'panel-right-75p'
  panelImage?: string
  submitAction: SubmitAction<T>
  classes?: string
  rows: Array<FormRow | SubmitFormRow<T> | null>
}

type SubmitAction<T extends SignUpFormData> = (
  data: T
) => Promise<SubmitActionResponse> | SubmitActionResponse
export type SubmitActionResponse = [
  {
    params?: { step: string; userType?: UserType }
    path?: string
    query?: any
  } | null,
  ErrorMessage | null,
]
type ErrorMessage = string

export type FormRow = {
  classes: string
  elements: Array<FormElement>
}
export type SubmitFormRow<T extends SignUpFormData> = FormRow & {
  elements: Array<FormElement | SubmitButtonFormElement<T>>
}

export type FormElement = {
  element: FormElementType
  classes?: string
  content?: string
  props?: any // TODO: Make generic for each FormElement.
  showIf?: (form: any) => boolean
}
export type SubmitButtonFormElement<T extends SignUpFormData> = FormElement & {
  isDisabledOnInvalid?: boolean
  submitAction: SubmitAction<T>
}

type FormElementType =
  | 'h1'
  | 'h2'
  | 'p'
  | 'a'
  | 'button'
  | 'FormCheckBox'
  | 'FormSelect'
  | 'FormInput'
  | 'FormEmail'
  | 'FormSchoolSearch'
  | 'FormPassword'
  | 'SsoButton'
  | 'LineDivider'
  | 'router-link'
  | 'check-circled'
  | 'header-logo-teal'
  | 'updog-crying'
  | 'updog-smiling'

export function getFilteredPageDetails(
  cb: () => PageDetailsUnion<SignUpFormData>
): PageDetailsUnion<SignUpFormData> {
  const pd = cb()
  pd.rows = pd.rows.filter((row) => !!row)
  return pd
}

const EMAIL_ALREADY_IN_USE = 'The email address you entered is already in use'
export function getSubmitResponse(
  nextPage: SignUpPage | null = null,
  data: SignUpFormData | null = null,
  err: any | null = null
): SubmitActionResponse {
  if (err) {
    const error =
      typeof err === 'string'
        ? err
        : err.response?.data?.err ?? 'Failed: Please try again.'
    if (error === EMAIL_ALREADY_IN_USE) {
      router.push(
        '/login?' +
          new URLSearchParams({
            message:
              'Looks like you already have an UPchieve account, please sign in!',
          }).toString()
      )
    }
    return [null, error]
  }

  switch (nextPage) {
    case SignUpPage.eligibility:
    case SignUpPage.parentGuardianConfirmation:
    case SignUpPage.account:
    case SignUpPage.ineligible:
      return [
        {
          params: {
            ...data,
            step: nextPage,
          },
        },
        null,
      ]
    case SignUpPage.verify:
      return [{ path: '/verify' }, null]
  }

  return [null, null]
}

export function createAccountWithGoogle(
  userType: UserType,
  data: AccountFormData
) {
  AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_GOOGLE)
  return createAccountWithSso(SsoProvider.GOOGLE, userType, data)
}

export function createAccountWithClever(
  userType: UserType,
  data: AccountFormData
) {
  AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_CLEVER)
  return createAccountWithSso(SsoProvider.CLEVER, userType, data)
}

function createAccountWithSso(
  provider: SsoProvider,
  userType: UserType,
  data: AccountFormData
): SubmitActionResponse {
  try {
    if (userType === UserType.student) {
      localStorage.setItem('isSSOSignUpRedirect', 'true')
    }
    signInWithSso({
      provider,
      errorRedirect: `/sign-up/${userType}/account`,
      ...data,
    })
    return [null, null]
  } catch (err) {
    LoggerService.noticeError(err)
    return getSubmitResponse(null, null, err)
  }
}

export function getRow<T extends SignUpFormData>(
  classes = '',
  ...elements: Array<FormElement | SubmitButtonFormElement<T> | undefined>
): FormRow {
  return {
    classes,
    elements: elements.filter((e) => !!e),
  }
}

export function getTextElement(
  element: FormElementType,
  content: string
): FormElement {
  return {
    element,
    content,
  }
}

export function getInputElement(
  name: string,
  prettyName: string,
  blurEvent: string,
  classes: string = ''
): FormElement {
  return {
    element: 'FormInput',
    classes,
    props: {
      blurEvent,
      name,
      label: prettyName,
      placeholder: prettyName,
    },
  }
}

export function getSsoButton<T extends SignUpFormData>(
  submitAction: SubmitAction<T>,
  content: string,
  ssoMethod: SsoProvider
): SubmitButtonFormElement<T> {
  return {
    element: 'SsoButton',
    submitAction,
    props: {
      buttonText: content,
      ssoMethod,
    },
  }
}

export function getButtonElement<T extends SignUpFormData>(
  submitAction: SubmitAction<T>,
  content: string,
  classes = '',
  isDisabledOnInvalid = true
): SubmitButtonFormElement<T> {
  return {
    element: 'button',
    classes: 'uc-form-button ' + classes,
    content,
    isDisabledOnInvalid,
    submitAction,
  }
}

export function getRouterLinkElement(
  content: string,
  pathTo: string
): FormElement {
  return {
    element: 'router-link',
    classes: 'uc-link',
    content: content,
    props: {
      to: pathTo,
    },
  }
}

export function getLinkElement(content: string, link: string): FormElement {
  return {
    element: 'a',
    classes: 'uc-link',
    content: content,
    props: {
      href: link,
    },
  }
}

export function getSignUpSourceElement(
  name: string,
  blurEvent: string
): FormElement {
  return {
    element: 'FormSelect',
    props: {
      blurEvent,
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
      name,
      optionTextField: 'name',
      placeholder: 'How did you hear about us?',
      reduce: (option: { id: string }) => option.id,
    },
  }
}

export function getAlreadyHaveAccountElements() {
  return [
    getTextElement('p', 'Already have an account?'),
    getRouterLinkElement('Log in', '/login'),
  ]
}
