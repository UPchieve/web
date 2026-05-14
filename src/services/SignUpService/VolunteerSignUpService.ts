import type {
  NavigationGuardNext,
  RouteLocation,
  RouteLocationNormalized,
} from 'vue-router'
import NetworkService from '@/services/NetworkService'
import { SignUpPage, UserType } from '@/services/SignUpService/types'
import {
  getRow,
  getTextElement,
  getButtonElement,
  getAlreadyHaveAccountElements,
  getSubmitResponse,
  getSignUpSourceElement,
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
import AnalyticsService from '@/services/AnalyticsService'

const RoutePath = {
  account: `/sign-up/volunteer/account`,
  about: '/sign-up/volunteer/about',
  verify: `/${SignUpPage.verify}`,
  partnerSignup: `/sign-up/volunteer?partnerId`,
}

// The following values are used as the `name` attribute on form elements,
// and should match the keys in server requests.
export enum InputName {
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  PASSWORD = 'password', // pragma: allowlist secret
  PHONE = 'phone',
  SIGNUP_SOURCE_ID = 'signupSourceId',
  TERMS = 'terms',
  INVITE_CODE = 'inviteCode',
  REFERRED_BY_CODE = 'referredByCode',
}

export type VolunteerAccountFormData = {
  [InputName.EMAIL]?: string
  [InputName.PASSWORD]?: string
  [InputName.FIRST_NAME]?: string
  [InputName.LAST_NAME]?: string
  [InputName.PHONE]?: string
  [InputName.SIGNUP_SOURCE_ID]?: string
  [InputName.TERMS]?: boolean
  [InputName.INVITE_CODE]?: string
}

const isGoogleSignupForVolunteersEnabled = () =>
  store.getters['featureFlags/isGoogleSignupForVolunteersEnabled']

let partnerId: string = ''

export async function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.account }
): Promise<PageDetail<VolunteerAccountFormData>>
export async function getPageDetails(
  to: RouteLocation & { path: typeof RoutePath.about }
): Promise<PageDetailsUnion<VolunteerAccountFormData>> {
  if (isAccountRoute(to)) {
    return await getLogInDetails()
  } else if (isPartnerSignup(to)) {
    partnerId = to.query.partnerId as string
    return await getLogInDetails(true)
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

function isPartnerSignup(to: RouteLocation) {
  return to.fullPath.includes(RoutePath.partnerSignup)
}

async function getLogInDetails(
  isPartnerSignup: boolean = false
): Promise<PageDetail<VolunteerAccountFormData>> {
  let volunteerPartnerName: string = ''
  if (isPartnerSignup) {
    const { data } = await NetworkService.getVolunteerPartner(partnerId)
    volunteerPartnerName = data.volunteerPartner.name
  }

  const welcomeText = isPartnerSignup
    ? `Welcome ${volunteerPartnerName} Volunteer!`
    : `Become a Volunteer`

  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: continueToSignUp,
    panelImage: 'volunteer-signup-illustration',
    classes: 'uc-column justify-center justify-start-sm',
    rows: [
      getRow('justify-center', {
        element: 'header-logo-teal',
      }),
      getRow('mt-4 justify-center', getTextElement('h1', welcomeText)),
      ...(isPartnerSignup
        ? getPartnerRedirectElement(volunteerPartnerName)
        : []),
      ...(isGoogleSignupForVolunteersEnabled() ? getSsoSectionElements() : []),
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
          showPasswordRequirements: true,
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

export async function createAccount( // exported for testing
  data: VolunteerAccountFormData
): Promise<SubmitActionResponse> {
  try {
    const options = {
      [InputName.INVITE_CODE]: data.inviteCode,
      [InputName.EMAIL]: data.email,
      [InputName.PASSWORD]: data.password,
      [InputName.FIRST_NAME]: data.firstName,
      [InputName.LAST_NAME]: data.lastName,
      [InputName.PHONE]: data.phone,
      [InputName.TERMS]: true,
      [InputName.REFERRED_BY_CODE]:
        window.localStorage.getItem('upcReferredByCode'),
    }

    const result = partnerId
      ? await NetworkService.registerPartnerVolunteer({
          ...options,
          volunteerPartnerOrg: partnerId,
        })
      : await NetworkService.registerOpenVolunteer({
          ...options,
          [InputName.SIGNUP_SOURCE_ID]: data.signupSourceId,
        })
    window.localStorage.removeItem('upcReferredByCode')
    AnalyticsService.registerVolunteer(result.data.user)
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

function getPartnerRedirectElement(partnerName: string) {
  return [
    getRow(
      `justify-left mt-1 el-gap-sm text-sm`,
      {
        element: 'p',
        content: `Not with ${partnerName}?`,
      },
      {
        element: 'a',
        classes: 'uc-link',
        content: 'Click here.',
        props: {
          href: 'https://upchieve.org/volunteer',
          target: '_blank',
        },
      }
    ),
  ]
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

export async function beforeEnter(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (to.query.inviteCode) {
    to.params.inviteCode = to.query.inviteCode as string
    to.params.email = to.query.email as string
    delete to.query.inviteCode
    delete to.query.email
  }
  return next()
}
