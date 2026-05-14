import { SignUpPage, UserType } from '@/services/SignUpService/types'
import { EVENTS } from '@/consts'
import router from '@/router'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { SsoProvider, signInWithSso } from '@/services/SsoService'
import type {
  StudentAccountFormData,
  StudentEligibilityFormData,
  StudentSignUpFormData,
} from './StudentSignUpService'
import type {
  TeacherAccountFormData,
  TeacherEligibilityFormData,
  TeacherSignUpFormData,
} from './TeacherSignUpService'
import type { VolunteerAccountFormData } from './VolunteerSignUpService'

// TODO: Move more common types into types.ts
export type SignUpFormData = StudentSignUpFormData | TeacherSignUpFormData
export type EligibilityFormData =
  | StudentEligibilityFormData
  | TeacherEligibilityFormData
type AccountFormData =
  | StudentAccountFormData
  | TeacherAccountFormData
  | VolunteerAccountFormData

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
  | 'FormPhoneInput'
  | 'SsoButton'
  | 'LineDivider'
  | 'router-link'
  | 'check-circled'
  | 'header-logo-teal'
  | 'updog-crying'
  | 'updog-smiling'
  | 'error-badge'
  | 'InternationalMessage'

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
        : (err.response?.data?.err ??
          err?.message ??
          'Failed: Please try again.')
    if (error === EMAIL_ALREADY_IN_USE) {
      router.replace(
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
    case SignUpPage.about:
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

const signUpMethodByProvider: Record<
  SsoProvider,
  (userType: UserType, data: AccountFormData) => SubmitActionResponse
> = {
  [SsoProvider.GOOGLE]: createAccountWithGoogle,
  [SsoProvider.CLEVER]: createAccountWithClever,
  [SsoProvider.CLASSLINK]: createAccountWithClassLink,
}

export function createAccountWithProvider(
  provider: SsoProvider,
  userType: UserType,
  data: AccountFormData
) {
  const method = signUpMethodByProvider[provider]
  if (!method) {
    throw new Error(`No sign-up method found for provider: ${provider}`)
  }
  return method(userType, data)
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

export function createAccountWithClassLink(
  userType: UserType,
  data: AccountFormData
) {
  AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_CLASSLINK)
  return createAccountWithSso(SsoProvider.CLASSLINK, userType, data)
}

function createAccountWithSso(
  provider: SsoProvider,
  userType: UserType,
  data: AccountFormData
): SubmitActionResponse {
  try {
    localStorage.setItem('isSSOSignUpRedirect', 'true')
    signInWithSso({
      provider,
      errorRedirect:
        provider === SsoProvider.GOOGLE || provider === SsoProvider.CLASSLINK
          ? `/sign-up/${userType}/account`
          : '/clever-signin-instructions',
      accountType: userType,
      isLogin: 'false',
      ...data,
    })
    return [null, null]
  } catch (err) {
    LoggerService.noticeError(`${provider} error: ${err}`)
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

export function getPhoneInputElement(
  name: string,
  prettyName: string,
  classes: string = ''
): FormElement {
  return {
    element: 'FormPhoneInput',
    classes,
    props: {
      name,
      label: prettyName,
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
      type: 'button',
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
  isStudent: boolean,
  blurEvent?: string
): FormElement {
  return {
    element: 'FormSelect',
    props: {
      blurEvent,
      getOptionsAsync: async function () {
        try {
          const {
            data: { signupSources },
          } = await NetworkService.getStudentSignupSources()

          if (!isStudent) {
            let allSources = signupSources

            // volunteer sources drop School/Teacher and replace Friend/Classmate with Friend
            allSources = allSources.filter(
              (source: { name: string }) => source.name !== 'School / Teacher'
            )
            allSources.find(
              (source: { name: string }) => source.name === 'Friend / Classmate'
            ).name = 'Friend'
            return allSources
          } else {
            return signupSources
          }
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

const ELIGIBILITY_CHECK_TIMEOUT_MS = 10 * 60 * 1000
const ELIGIBILITY_CHECK_KEY_BASE = 'lastIneligible_'

export function ensureHasNoRecentIneligibility(
  userType: UserType,
  opts?: Record<string, string | undefined>
) {
  if (hasRecentIneligibilityCheck(userType)) {
    AnalyticsService.captureEvent(EVENTS.ELIGIBILITY_INELIGIBLE, {
      userType,
      source: 'cache',
      ...opts,
    })
    return true
  }
  return false
}

export function handleEligibilityResult(
  isEligible: boolean,
  userType: UserType,
  data: EligibilityFormData,
  opts: Record<string, string | undefined>
) {
  if (!isEligible) {
    storeIneligibilityCheck(userType)
  }

  AnalyticsService.captureEvent(
    isEligible ? EVENTS.ELIGIBILITY_ELIGIBLE : EVENTS.ELIGIBILITY_INELIGIBLE,
    {
      userType,
      ...opts,
    }
  )

  return getSubmitResponse(
    isEligible ? SignUpPage.account : SignUpPage.ineligible,
    data
  )
}

function hasRecentIneligibilityCheck(userType: UserType): boolean {
  const key = createEligibilityCheckKey(userType)
  const value = window.localStorage.getItem(key)
  if (!value) return false

  try {
    const lastCheck = parseInt(value)
    const now = Date.now()
    return now - lastCheck < ELIGIBILITY_CHECK_TIMEOUT_MS
  } catch {
    window.localStorage.removeItem(key)
    return false
  }
}

function storeIneligibilityCheck(userType: UserType): void {
  const key = createEligibilityCheckKey(userType)
  window.localStorage.setItem(key, Date.now().toString())
}

function createEligibilityCheckKey(userType: string) {
  return btoa(ELIGIBILITY_CHECK_KEY_BASE + userType)
}

// Exported for testing.
export const __test__ = {
  createEligibilityCheckKey,
}
