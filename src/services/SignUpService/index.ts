import config from '@/config'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'

export const SignUpPage = {
  account: 'account',
  eligibility: 'eligibility',
  ineligible: 'ineligible',
  parentGuardianConfirmation: 'confirmation',
  partnerInfo: 'info',
  verify: 'verify',
}

export const UserType = {
  student: 'student',
  teacher: 'teacher',
  volunteer: 'volunteer',
}

type PageDetail = {
  backgroundLayout: 'card' | 'panel-left-50p' | 'panel-left-75p' | 'panel-right-50p' | 'panel-right-75p'
  submitAction: SubmitAction
  classes: string
  rows: FormRow[]
}

type SubmitAction = (data: Object) => SubmitActionResponse
type SubmitActionResponse = [{ params: { step?: string, path?: string } } | null, ErrorMessage | null]
type ErrorMessage = string
type FormRow = {
  classes: string
  elements: FormElement[]
}
type FormElement = {
  element: FormElementType
  classes?: string
  content?: string
  isDisabledOnInvalid?: boolean
  submitAction?: SubmitAction
  props?: any // TODO: Make generic for each FormElement.
}
type FormElementType = 'h1' | 'p' | 'FormSelect' | 'FormInput' | 'FormEmail' | 'SsoButton' | 'button' | 'router-link' | 'a'



export function getFilteredPageDetails(cb: () => PageDetail): PageDetail {
  const pd = cb()
  pd.rows = pd.rows.filter((row: FormRow[]) => !!row)
  return pd
}

export function getSubmitResponseDefault(nextPage: string | null, data: Object | null, err?: any): SubmitActionResponse | undefined {
  if (err) {
    const error =
      typeof err === 'string'
        ? err
        : err.response?.data?.err ?? 'Failed: Please try again.'
    return [null, error]
  }

  switch (nextPage) {
    case SignUpPage.account:
      return [
        {
          params: {
            ...data,
            step: SignUpPage.account,
          },
        },
        null,
      ]
    case SignUpPage.ineligible:
      return [
        {
          params: {
            ...data,
            step: SignUpPage.ineligible,
          },
        },
        null,
      ]
    case SignUpPage.verify:
      return [{ path: '/verify' }, null]
  }
}

export function continueToAccountPage(data: Object) {
  return getSubmitResponseDefault(SignUpPage.account, data)
}

export function createAccountWithSso(provider: 'google' | 'clever', data: Object) {
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
    return getSubmitResponseDefault(null, null, err)
  }
}

export function getRow(classes = '', ...elements: FormElement[]): FormRow {
  return {
    classes,
    elements: elements.filter((e) => !!e),
  }
}

export function getTextElement(element: FormElementType, content: string): FormElement {
  return {
    element,
    content,
  }
}

export function getInputElement(name: string, prettyName: string, blurEvent: string, classes): FormElement {
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

export function getSsoButton(submitAction: SubmitAction, content: string, ssoMethod = 'google'): FormElement {
  return {
    element: 'SsoButton',
    submitAction,
    props: {
      buttonText: content,
      ssoMethod,
    },
  }
}

export function getButtonElement(submitAction: SubmitAction, content: string, classes = ''): FormElement {
  return {
    element: 'button',
    classes: 'uc-form-button ' + classes,
    content,
    isDisabledOnInvalid: true,
    submitAction,
  }
}

export function getRouterLinkElement(content: string, pathTo: string): FormElement {
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

export function getSignUpSourceElement(name: string, blurEvent: string) {
  return {
    element: 'FormSelect',
    props: {
      blurEvent,
      getSelectOptions: async function() {
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
      reduce: (option) => option.id,
    },
  }
}


export function getAlreadyHaveAccountElements() {
  return [
    getTextElement('p', 'Already have an account?'),
    getRouterLinkElement('Log in', '/login'),
  ]
}
