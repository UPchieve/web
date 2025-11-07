import type { RouteLocation } from 'vue-router'
import NetworkService from '@/services/NetworkService'
import {
  SignUpPage,
  getRow,
  getTextElement,
  getButtonElement,
  getAlreadyHaveAccountElements,
  getSubmitResponse,
  getSignUpSourceElement,
  UserType,
  getSsoButton,
} from '@/services/SignUpService'
import type {
  PageDetail,
  PageDetailsUnion,
  SubmitActionResponse,
  FormRow,
} from '@/services/SignUpService'
import store from '@/store'
import { SsoProvider } from '@/services/SsoService'
import * as SignUpService from '@/services/SignUpService'

const RoutePath = {
  account: `/sign-up/volunteer/account`,
  about: '/sign-up/volunteer/about',
  verify: `/${SignUpPage.verify}`,
}

// The following values are used as the `name` attribute on form elements,
// and should match the keys in server requests.
export enum InputName {
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  PASSWORD = 'password',
  PHONE = 'phone',
  SIGNUP_SOURCE_ID = 'signupSourceId',
  TERMS = 'terms',
}

export type VolunteerAccountFormData = {
  [InputName.EMAIL]?: string
  [InputName.PASSWORD]?: string
  [InputName.FIRST_NAME]?: string
  [InputName.LAST_NAME]?: string
  [InputName.PHONE]?: string
  [InputName.SIGNUP_SOURCE_ID]?: string
  [InputName.TERMS]?: boolean
}

const isGoogleSignupForVolunteersEnabled =
  store.getters['featureFlags/isGoogleSignupForVolunteersEnabled']

export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.account }
): PageDetail<VolunteerAccountFormData>
export function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.about }
): PageDetailsUnion<VolunteerAccountFormData> {
  if (isAccountRoute(to)) {
    return getLogInDetails()
  }
  return getAboutDetails()
}

async function continueToSignUp(
  data: VolunteerAccountFormData
): Promise<SubmitActionResponse> {
  try {
    await NetworkService.checkRegister({
      email: data.email,
      password: data.password,
    })

    return getSubmitResponse(SignUpPage.about)
  } catch (err) {
    return getSubmitResponse(null, null, err)
  }
}

function isAccountRoute(to: RouteLocation) {
  return to.path === RoutePath.account
}

function getLogInDetails(): PageDetail<VolunteerAccountFormData> {
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: continueToSignUp,
    panelImage: 'volunteer-signup-illustration',
    classes: 'uc-column justify-center justify-start-sm',
    rows: [
      getRow('justify-center', {
        element: 'header-logo-teal',
      }),
      getRow('mt-4 justify-center', getTextElement('h1', `Become a Volunteer`)),
      ...(isGoogleSignupForVolunteersEnabled ? getSsoSectionElements() : []),
      getRow('mt-2 justify-center'),
      getRow('mt-2', {
        element: 'FormEmail',
        props: {
          name: InputName.EMAIL,
          metadata:
            'We will only use your email to contact you about your account. See our Privacy Policy for more info.',
        },
      }),
      getRow('mt-2', {
        element: 'FormPassword',
        props: {
          name: InputName.PASSWORD,
        },
      }),
      getRow(
        'mt-3 justify-start',
        getButtonElement(continueToSignUp, 'Continue')
      ),
      getRow('justify-center mt-4', ...getAlreadyHaveAccountElements()),
    ],
  }
}

async function createAccount(
  data: VolunteerAccountFormData
): Promise<SubmitActionResponse> {
  try {
    await NetworkService.registerOpenVolunteer({
      [InputName.EMAIL]: data.email,
      [InputName.PASSWORD]: data.password,
      [InputName.FIRST_NAME]: data.firstName,
      [InputName.LAST_NAME]: data.lastName,
      [InputName.PHONE]: data.phone,
      [InputName.SIGNUP_SOURCE_ID]: data.signupSourceId,
      [InputName.TERMS]: true,
    })

    return getSubmitResponse(SignUpPage.verify)
  } catch (err) {
    return getSubmitResponse(null, null, err)
  }
}

function getAboutDetails(): PageDetail<VolunteerAccountFormData> {
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: createAccount,
    panelImage: 'volunteer-signup-illustration',
    classes: 'uc-column justify-center justify-start-sm',
    rows: [
      getRow('justify-center', {
        element: 'header-logo-teal',
      }),
      getRow('mt-4', {
        element: 'FormInput',
        props: {
          name: InputName.FIRST_NAME,
          label: 'First Name',
        },
      }),
      getRow('mt-4', {
        element: 'FormInput',
        props: {
          name: InputName.LAST_NAME,
          label: 'Last Name',
        },
      }),
      getRow('mt-4', {
        element: 'FormPhoneInput',
        props: {
          name: InputName.PHONE,
          label: 'Phone Number',
          subtext: `UPchieve notifies volunteers of incoming student requests via text. You
              can customize when you receive requests.`,
        },
      }),
      getRow('mt-2', getSignUpSourceElement(InputName.SIGNUP_SOURCE_ID, false)),
      getRow(
        'justify-end mt-4',
        getButtonElement<VolunteerAccountFormData>(
          createAccount,
          'Sign Up',
          'button-narrow'
        )
      ),
      ...getTermsCheckboxElements('text-sm', 'justify-end', 'mt-2'),
    ],
  }
}

function getTermsCheckboxElements(
  sizeClass: string = '',
  justify: string = 'justify-start',
  mt: string = 'mt-4'
) {
  return [
    getRow(
      `${justify} ${mt} el-gap-sm ${sizeClass}`.trim(),
      {
        element: 'p',
        classes: 'metadata',
        content: 'By clicking this button above, you agree to our',
      },
      {
        element: 'a',
        classes: 'uc-link',
        content: 'User',
        props: {
          href: 'https://upchieve.org/legal',
          target: '_blank',
        },
      },
      {
        element: 'p',
        classes: 'metadata',
        content: 'and',
        props: {},
      },
      {
        element: 'a',
        classes: 'uc-link',
        content: 'Volunteer Agreement.',
        props: {
          href: 'https://upchieve.org/legal#volunteer-agreement',
          target: '_blank',
        },
      }
    ),
  ]
}

function createAccountWithProvider(
  provider: SsoProvider,
  data: VolunteerAccountFormData
) {
  return SignUpService.createAccountWithProvider(
    provider,
    UserType.volunteer,
    data
  )
}

function createAccountWithGoogle(data: VolunteerAccountFormData) {
  return createAccountWithProvider(SsoProvider.GOOGLE, data)
}

function getSsoSectionElements(): FormRow[] {
  const rows: FormRow[] = []

  rows.push(
    getRow(
      'mt-4',
      getSsoButton(
        createAccountWithGoogle,
        'Sign Up with Google',
        SsoProvider.GOOGLE
      )
    )
  )
  rows.push(
    ...getTermsCheckboxElements(),
    getRow('mt-2 mb-2', { element: 'LineDivider', props: { text: 'or' } })
  )
  return rows
}
