import config from '@/config'
import LoggerService from '@/services/LoggerService'

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

/**
 * type PageDetail = {
 *   backgroundLayout: 'card' | 'panel-right-50p' etc.,
 *   submitAction: (fd: FormData) => string[],
 *   classes: string,
 *   rows: [
 *     classes: string,
 *     elements: {
 *       element: FormElement,
 *       classes: string,
 *       content: string,
 *       submitAction: (fd: FormData) => SubmitActionResponse,
 *       props: {
 *         name: InputName
 *         ...etc
 *       }
 *     }[],
 * }
 * type FormElement = 'h1' | 'p' | 'FormSelect' | 'FormInput' | 'FormEmail' etc.
 */
export function getFilteredPageDetails(cb) {
  const pd = cb()
  pd.rows = pd.rows.filter((row) => !!row)
  return pd
}

/**
 * type SubmitActionResponse = [valid router object, error]
 */
export function getSubmitResponseDefault(nextPage, data, err) {
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

export function continueToAccountPage(data) {
  return getSubmitResponseDefault(SignUpPage.account, data)
}

export function createAccountWithSso(provider, data) {
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

export function getRow(classes = '', ...elements) {
  return {
    classes,
    elements: elements.filter((e) => !!e),
  }
}

export function getTextElement(element, content) {
  return {
    element,
    content,
  }
}

export function getInputElement(name, prettyName, blurEvent) {
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

export function getSsoButton(submitAction, content, ssoMethod = 'google') {
  return {
    element: 'SsoButton',
    submitAction,
    props: {
      buttonText: content,
      ssoMethod,
    },
  }
}

export function getButtonElement(submitAction, content, classes = '') {
  return {
    element: 'button',
    classes: 'uc-form-button ' + classes,
    content,
    isDisabledOnInvalid: true,
    submitAction,
  }
}

export function getRouterLinkElement(content, pathTo) {
  return {
    element: 'router-link',
    classes: 'uc-link ml-1',
    content: content,
    props: {
      to: pathTo,
    },
  }
}

export function getAlreadyHaveAccountElements() {
  return [
    getTextElement('p', 'Already have an account?'),
    getRouterLinkElement('Log in', '/login'),
  ]
}
