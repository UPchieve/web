import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocation } from 'vue-router'
import * as StudentSignUpService from '@/services/SignUpService/StudentSignUpService'
import * as TeacherSignUpService from '@/services/SignUpService/TeacherSignUpService'
import * as VolunteerSignUpService from '@/services/SignUpService/VolunteerSignUpService'
import * as SignUpService from '@/services/SignUpService'
import type {
  FormElement,
  PageDetail,
  SubmitButtonFormElement,
} from '@/services/SignUpService'
import { UserType } from '@/services/SignUpService/types'
import { SsoProvider, signInWithSso } from '@/services/SsoService'

vi.mock('@/services/AnalyticsService')
vi.mock('@/services/SsoService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/SsoService')>()),
  signInWithSso: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(signInWithSso).mockClear()
})

const route = (path: string) =>
  ({
    path,
    fullPath: path,
    params: {},
    query: {},
  }) as unknown as RouteLocation & { path: string }

const spoofed = {
  provider: 'evil',
  errorRedirect: 'https://evil.example.com',
  accountType: 'admin',
  isLogin: 'true',
}

const nonAttribution = {
  password: 'Password123',
  step: 'account',
  junk: 'x',
}

describe('SSO sign-up buttons', () => {
  const studentAccountPage = () =>
    StudentSignUpService.getPageDetails(
      route('/sign-up/student/account'),
      route('/sign-up/student/eligibility')
    )
  const studentAttribution = {
    gradeLevel: '9th',
    schoolId: 'school-1',
    signupSourceId: '3',
    studentPartnerOrgKey: 'partner-key',
    studentPartnerOrgSiteName: 'Site A',
    zipCode: '10001',
  }

  const volunteerAccountPage = () =>
    VolunteerSignUpService.getPageDetails(route('/sign-up/volunteer/account'))

  const allProviders = Object.values(SsoProvider)

  it.each([
    {
      name: 'student',
      role: UserType.student,
      inputNames: Object.values(StudentSignUpService.InputName),
      getAccountPageDetails: studentAccountPage,
      providers: allProviders,
      attribution: { ...studentAttribution, classCode: undefined },
    },
    {
      name: 'class code student',
      role: UserType.student,
      inputNames: Object.values(StudentSignUpService.InputName),
      getAccountPageDetails: studentAccountPage,
      providers: allProviders,
      attribution: {
        ...studentAttribution,
        classCode: 'CLASS1',
        email: 'user@example.com',
      },
    },
    {
      name: 'teacher',
      role: UserType.teacher,
      inputNames: Object.values(TeacherSignUpService.InputName),
      getAccountPageDetails: () =>
        TeacherSignUpService.getPageDetails(route('/sign-up/teacher/account')),
      providers: allProviders,
      attribution: { schoolId: 'school-1', signupSource: 'web' },
    },
    {
      name: 'volunteer',
      role: UserType.volunteer,
      inputNames: Object.values(VolunteerSignUpService.InputName),
      getAccountPageDetails: volunteerAccountPage,
      providers: [SsoProvider.GOOGLE],
      attribution: { inviteCode: undefined },
    },
    {
      name: 'invite code volunteer',
      role: UserType.volunteer,
      inputNames: Object.values(VolunteerSignUpService.InputName),
      getAccountPageDetails: volunteerAccountPage,
      providers: [SsoProvider.GOOGLE],
      attribution: { inviteCode: 'INV1', email: 'user@example.com' },
    },
  ])(
    'sends only $name attribution from each SSO button',
    async ({
      role,
      inputNames,
      getAccountPageDetails,
      providers,
      attribution,
    }) => {
      const roleFormKeys = Object.fromEntries(
        inputNames.map((key) => [key, `leak-${key}`])
      )
      const pageDetails: PageDetail<any> = await getAccountPageDetails()

      for (const provider of providers) {
        const button = pageDetails.rows
          .flatMap((row) => row?.elements ?? [])
          .find(
            (el: FormElement) =>
              el.element === 'SsoButton' && el.props.ssoMethod === provider
          ) as SubmitButtonFormElement<any>
        button.submitAction({
          ...roleFormKeys,
          ...nonAttribution,
          ...attribution,
        })
      }

      expect(vi.mocked(signInWithSso).mock.calls).toEqual(
        providers.map((provider) => [
          {
            ...attribution,
            provider,
            errorRedirect:
              provider === SsoProvider.CLEVER
                ? '/clever-signin-instructions'
                : `/sign-up/${role}/account`,
            accountType: role,
            isLogin: 'false',
          },
        ])
      )
    }
  )
})

describe('createAccountWithGoogle', () => {
  it('keeps provider, errorRedirect, accountType and isLogin from its own arguments', () => {
    SignUpService.createAccountWithGoogle(UserType.student, spoofed)

    expect(signInWithSso).toHaveBeenCalledExactlyOnceWith({
      provider: SsoProvider.GOOGLE,
      errorRedirect: '/sign-up/student/account',
      accountType: UserType.student,
      isLogin: 'false',
    })
  })
})
