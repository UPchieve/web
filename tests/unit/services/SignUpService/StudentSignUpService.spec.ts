import { beforeEach, describe, expect, test, vi } from 'vitest'
import type {
  RouteLocation,
  NavigationGuardNext,
  RouteLocationNormalized,
} from 'vue-router'
import store from '@/store'
import router from '@/router'
import {
  __test__,
  beforeEnter,
} from '@/services/SignUpService/StudentSignUpService'
import * as SignUpService from '@/services/SignUpService'
import NetworkService from '@/services/NetworkService'
import AuthService from '@/services/AuthService'
import type {
  FormElement,
  FormRow,
  SubmitButtonFormElement,
  SubmitFormRow,
} from '@/services/SignUpService'
import { UserType } from '@/services/SignUpService/types'

vi.mock('@/services/AnalyticsService')
vi.mock('@/services/AuthService')
vi.mock('@/services/NetworkService')
const mockedAuthService = vi.mocked(AuthService)
const mockedNetworkService = vi.mocked(NetworkService)

function findElementAndRow(
  rows: (FormRow | SubmitFormRow<any> | null)[],
  search: (element: FormElement) => boolean
):
  | { formElement: FormElement | SubmitButtonFormElement<any>; row: FormRow }
  | undefined {
  for (const row of rows) {
    if (!row) continue

    for (const formElement of row.elements) {
      if (search(formElement)) {
        return { formElement, row }
      }
    }
  }
}

describe('StudentSignUpService', () => {
  describe('Check eligibility step', () => {
    describe('getEligibilityPageDetails', () => {
      test('returns correct page details for organic student', () => {
        const route = {
          path: '/sign-up/student/eligibility',
          params: {},
          query: {},
        } as RouteLocation

        const pageDetails = __test__.getEligibilityPageDetails(route)
        const expectedRows = [
          'logo',
          'header',
          'existingAccountLink',
          'gradeLevel/zipCode',
          'school',
          'signupSource',
          'submitButton',
        ]
        expect(pageDetails.rows.filter((r) => !!r).length).toBe(
          expectedRows.length
        )

        const header = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h1'
        )
        expect(header?.formElement.content).toBe(
          'Check if you are eligible for UPchieve'
        )

        const existingAccountLink = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'router-link'
        )
        expect(existingAccountLink?.row.elements[0].content).toBe(
          'Already have an account?'
        )
        expect(existingAccountLink?.row.elements[1].content).toBe('Log in')

        const grade = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'gradeLevel'
        )
        expect(grade).toBeDefined()
        expect(grade?.formElement.props.label).toContain('Grade in')

        const zipCode = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'zipCode'
        )
        expect(zipCode).toBeDefined()
        expect(zipCode?.formElement.props.label).toBe('Zip Code')

        const school = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'FormSchoolSearch'
        )
        expect(school).toBeDefined()
        expect(school?.formElement.props.label).toBe('School Name')

        const signupSource = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'signupSourceId'
        )
        expect(signupSource).toBeDefined()
        expect(signupSource?.formElement.props.label).toBe(
          'How did you hear about us?'
        )

        const submitButton = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'button' && e.content === 'Check eligibility'
        )
        expect(
          (submitButton?.formElement as SubmitButtonFormElement<any>)
            ?.submitAction
        ).toBe(__test__.checkEligibility)
      })

      test('returns correct page details for parent/guardian', () => {
        const route = {
          path: '/sign-up/student/eligibility',
          params: { parent: 'true' },
          query: {},
        } as unknown as RouteLocation

        const pageDetails = __test__.getEligibilityPageDetails(route)
        const expectedRows = [
          'logo',
          'header',
          'existingAccountLink',
          'gradeLevel/zipCode',
          'school',
          'signupSource',
          'submitAction',
        ]
        expect(pageDetails.rows.filter((r) => !!r).length).toBe(
          expectedRows.length
        )

        const header = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h1'
        )
        expect(header?.formElement.content).toBe(
          'Check if your child is eligible for free tutoring with UPchieve'
        )

        const grade = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'gradeLevel'
        )
        expect(grade).toBeDefined()
        expect(grade?.formElement.props.label).toContain("Child's Grade in")

        const school = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'FormSchoolSearch'
        )
        expect(school).toBeDefined()
        expect(school?.formElement.props.label).toBe("Child's School Name")

        const zipCode = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'zipCode'
        )
        expect(zipCode).toBeDefined()
      })

      test('returns correct page details for school partner student', () => {
        const route = {
          path: '/sign-up/student/eligibility',
          params: {
            studentPartnerOrgKey: 'meow',
            studentPartnerName: 'Meow School',
            studentPartnerIsSchool: 'true',
          },
          query: {},
        } as unknown as RouteLocation

        const pageDetails = __test__.getEligibilityPageDetails(route)
        const expectedRows = [
          'logo',
          'header',
          'notWithPartnerLink',
          'gradeLevel/zipCode',
          'submitButton',
        ]
        expect(pageDetails.rows.filter((r) => !!r).length).toBe(
          expectedRows.length
        )
        const header = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h1'
        )
        expect(header?.formElement.content).toBe('Welcome Meow School Student!')

        const notWithPartnerLink = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'router-link'
        )
        expect(notWithPartnerLink?.formElement.content).toBe(
          'Not with Meow School?'
        )

        const school = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'FormSchoolSearch'
        )
        expect(school).toBeUndefined()

        const signupSource = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'signupSourceId'
        )
        expect(signupSource).toBeUndefined()
      })

      test('has school element if partner org is not a school', () => {
        const route = {
          path: '/sign-up/student/eligibility',
          params: {
            studentPartnerOrgKey: 'woof',
            studentPartnerName: 'Woof Org',
            studentPartnerIsSchool: 'false',
          },
          query: {},
        } as unknown as RouteLocation

        const pageDetails = __test__.getEligibilityPageDetails(route)
        const expectedRows = [
          'logo',
          'header',
          'notWithPartnerLink',
          'gradeLevel/zipCode',
          'school',
          'submitButton',
        ]
        expect(pageDetails.rows.filter((r) => !!r).length).toBe(
          expectedRows.length
        )

        const school = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'FormSchoolSearch'
        )
        expect(school).toBeDefined()
      })

      describe('returns correct title and subtitle for specific partner orgs', () => {
        test('code.org', () => {
          const route = {
            path: '/sign-up/student/eligibility',
            params: {
              studentPartnerOrgKey: 'code-org',
            },
            query: {},
          } as unknown as RouteLocation

          const pageDetails = __test__.getEligibilityPageDetails(route)

          const header = findElementAndRow(
            pageDetails.rows,
            (e) => e.element === 'h1'
          )
          expect(header?.formElement.content).toBe('Welcome to UPchieve!')

          const subheader = findElementAndRow(
            pageDetails.rows,
            (e) => e.element === 'p'
          )
          expect(
            subheader?.formElement.content?.endsWith(
              'including AP Computer Science.'
            )
          ).toBe(true)
        })

        test('College Confidential', () => {
          const route = {
            path: '/sign-up/student/eligibility',
            params: {
              utm_source: 'collegeconfidential',
            },
            query: {},
          } as unknown as RouteLocation

          const pageDetails = __test__.getEligibilityPageDetails(route)
          const header = findElementAndRow(
            pageDetails.rows,
            (e) => e.element === 'h1'
          )
          expect(header?.formElement.content).toBe('Get that A you deserve!')
          const subheader = findElementAndRow(
            pageDetails.rows,
            (e) => e.element === 'p'
          )
          expect(
            subheader?.formElement.content?.includes(
              'are more competitive during college admission'
            )
          ).toBe(true)
        })

        test('BigFuture', () => {
          const bfIntroCopy = 'Something for BF here.'
          const storeSpy = vi.spyOn(store, 'getters', 'get').mockReturnValue({
            'featureFlags/bfIntroCopy': bfIntroCopy,
          })

          const route = {
            path: '/sign-up/student/eligibility',
            params: {
              studentPartnerOrgKey: 'bigfuture',
              studentPartnerName: 'BigFuture',
            },
            query: {},
          } as unknown as RouteLocation

          const pageDetails = __test__.getEligibilityPageDetails(route)
          const header = findElementAndRow(
            pageDetails.rows,
            (e) => e.element === 'h1'
          )
          expect(header?.formElement.content).toBe('Welcome BigFuture Student!')
          const subheader = findElementAndRow(
            pageDetails.rows,
            (e) => e.element === 'p'
          )
          expect(subheader?.formElement.content).toBe(bfIntroCopy)

          storeSpy.mockRestore()
        })
      })
    })

    describe('checkEligibility', () => {
      const INELIGIBILITY_KEY =
        SignUpService.__test__.createEligibilityCheckKey(UserType.student)

      beforeEach(() => {
        vi.resetAllMocks()
        localStorage.clear()
      })

      test('checks eligibility when no previous check', async () => {
        const data = {
          gradeLevel: '9th',
          schoolId: 'school-id-123',
          zipCode: '97878',
        }
        await __test__.checkEligibility(data)

        expect(
          mockedNetworkService.checkStudentEligibility
        ).toHaveBeenCalledWith({
          email: '',
          gradeLevel: data.gradeLevel,
          referredByCode: null,
          schoolId: data.schoolId,
          zipCode: data.zipCode,
        })
      })

      test('checks eligibility when the previous check was not recent', async () => {
        const date = new Date()
        localStorage.setItem(
          INELIGIBILITY_KEY,
          date.setMinutes(date.getMinutes() - 10).toString()
        )

        const data = {
          gradeLevel: '12th',
          schoolId: 'school-id-456',
          zipCode: '87879',
        }
        await __test__.checkEligibility(data)
        expect(
          mockedNetworkService.checkStudentEligibility
        ).toHaveBeenCalledWith({
          email: '',
          gradeLevel: data.gradeLevel,
          referredByCode: null,
          schoolId: data.schoolId,
          zipCode: data.zipCode,
        })
      })

      test('does not check eligibility again when the previous check was recent', async () => {
        const date = new Date()
        localStorage.setItem(
          INELIGIBILITY_KEY,
          date.setMinutes(date.getMinutes() - 9).toString()
        )
        const data = { gradeLevel: 'College', schoolId: 'school-id-789' }
        await __test__.checkEligibility(data)
        expect(
          mockedNetworkService.checkStudentEligibility
        ).not.toHaveBeenCalled()
      })

      test('sets local storage key when ineligible', async () => {
        expect(localStorage.getItem(INELIGIBILITY_KEY)).toBe(null)
        mockedNetworkService.checkStudentEligibility.mockResolvedValue({
          data: { isEligible: false },
        })

        await __test__.checkEligibility({})
        expect(localStorage.getItem(INELIGIBILITY_KEY)).toBeDefined()
      })

      test('returns account page as next page when eligible', async () => {
        const data = { gradeLevel: '12th', schoolId: 'school-id-abc' }

        mockedNetworkService.checkStudentEligibility.mockResolvedValue({
          data: { isEligible: true },
        })

        const result = await __test__.checkEligibility(data)

        expect(result[0]).toEqual({
          params: {
            ...data,
            step: 'account',
          },
        })
        expect(result[1]).toBeNull()
      })

      test('returns ineligible page as next page when ineligible', async () => {
        const data = { gradeLevel: 'College', schoolId: 'school-id-def' }

        mockedNetworkService.checkStudentEligibility.mockResolvedValue({
          data: { isEligible: false },
        })

        const result = await __test__.checkEligibility(data)

        expect(result[0]).toEqual({
          params: {
            ...data,
            step: 'ineligible',
          },
        })
        expect(result[1]).toBeNull()
      })
    })
  })

  describe('Ineligibility step', () => {
    test('getIneligiblePageDetails returns the correct rows', () => {
      const pageDetails = __test__.getIneligiblePageDetails()

      expect(pageDetails.backgroundLayout).toBe('full')
      expect(pageDetails.submitAction).toBe(__test__.ineligibleContinue)
      expect(pageDetails.classes).toBe('text-center screen-narrow')

      const expectedRows = ['updog-crying', 'header', 'body', 'continueButton']
      expect(pageDetails.rows.length).toBe(expectedRows.length)

      const updogElement = findElementAndRow(
        pageDetails.rows,
        (e) => e.element === 'updog-crying'
      )
      expect(updogElement).toBeDefined()

      const header = findElementAndRow(
        pageDetails.rows,
        (e) => e.element === 'h1'
      )
      expect(header).toBeDefined()

      const body = findElementAndRow(pageDetails.rows, (e) => e.element === 'p')
      expect(body).toBeDefined()

      const continueButton = findElementAndRow(
        pageDetails.rows,
        (e) => e.element === 'button'
      )
      expect(continueButton?.formElement.content).toBe('Continue')
      // @ts-expect-error submit action does not exist on formElement
      expect(continueButton?.formElement.submitAction).toBe(
        __test__.ineligibleContinue
      )
    })
  })

  describe('Create account step', () => {
    describe('getAccountPageDetails', () => {
      test('returns correct page details for organic student', () => {
        const route = {
          path: '/sign-up/student/account',
          params: {
            gradeLevel: '10th',
            schoolId: 'school-123',
            zipCode: '12345',
          },
          query: {},
        } as unknown as RouteLocation

        const pageDetails = __test__.getAccountPageDetails(route)
        const expectedRows = [
          'logo',
          'header',
          'subheader',
          'cleverButton',
          'googleButton',
          'orLineBreak',
          'firstName',
          'lastName',
          'email',
          'password',
          'terms',
          'submitButton',
        ]
        expect(pageDetails.rows.filter((r) => !!r).length).toBe(
          expectedRows.length
        )
        expect(pageDetails.backgroundLayout).toBe('panel-right-75p')
        expect(pageDetails.submitAction).toBe(__test__.createAccount)

        const header = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h1'
        )
        expect(header?.formElement.content).toContain(
          "You're eligible for UPchieve!"
        )

        const subheader = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h2'
        )
        expect(subheader?.formElement.content).toBe(
          'Finish creating your account'
        )

        const googleSsoButton = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'SsoButton' && e.props?.ssoMethod === 'google'
        )
        expect(googleSsoButton).toBeDefined()

        const cleverSsoButton = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'SsoButton' && e.props?.ssoMethod === 'clever'
        )
        expect(cleverSsoButton).toBeDefined()

        const firstName = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'firstName'
        )
        expect(firstName).toBeDefined()
        expect(firstName?.formElement.props.label).toBe('First Name')

        const lastName = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'lastName'
        )
        expect(lastName).toBeDefined()
        expect(lastName?.formElement.props.label).toBe('Last Name')

        const email = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'email'
        )
        expect(email).toBeDefined()
        expect(email?.formElement.props.label).toBe('Email')

        const password = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'FormPassword'
        )
        expect(password).toBeDefined()
        expect(password?.formElement.props.label).toBe('Password')

        const terms = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'terms'
        )
        expect(terms).toBeDefined()

        const submitButton = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'button' && e.content === 'Confirm'
        )
        expect(submitButton).toBeDefined()
        // @ts-expect-error submit action does not exist on formElement
        expect(submitButton?.formElement.submitAction).toBe(
          __test__.createAccount
        )
      })

      test('returns correct page details for parent/guardian', () => {
        const route = {
          path: '/sign-up/student/account',
          params: {
            parent: 'true',
            gradeLevel: '8th',
            schoolId: 'school-id-456',
            zipCode: '54321',
          },
          query: {},
        } as unknown as RouteLocation

        const pageDetails = __test__.getAccountPageDetails(route)
        const expectedRows = [
          'logo',
          'header',
          'subheader',
          'pgEmail',
          'childFirstName/childLastName',
          'childEmail',
          'terms',
          'submitButton',
        ]
        expect(pageDetails.rows.filter((r) => !!r).length).toBe(
          expectedRows.length
        )

        const header = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h1'
        )
        expect(header?.formElement.content).toContain(
          'Your child is eligible for UPchieve!'
        )

        const parentEmail = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'parentGuardianEmail'
        )
        expect(parentEmail).toBeDefined()
        expect(parentEmail?.formElement.props.label).toBe('Your Email')

        const firstName = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'firstName'
        )
        expect(firstName).toBeDefined()
        expect(firstName?.formElement.props.label).toBe("Child's First Name")

        const lastName = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'lastName'
        )
        expect(lastName).toBeDefined()
        expect(lastName?.formElement.props.label).toBe("Child's Last Name")

        const googleSsoButton = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'SsoButton' && e.props?.ssoMethod === 'google'
        )
        expect(googleSsoButton).toBeUndefined()

        const cleverSsoButton = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'SsoButton' && e.props?.ssoMethod === 'clever'
        )
        expect(cleverSsoButton).toBeUndefined()
      })

      test('returns correct page details for class code signup', () => {
        const route = {
          path: '/sign-up/student/account',
          params: {
            classCode: 'ABC123',
            gradeLevel: '11th',
            email: 'joinclass@student.org',
          },
          query: {},
        } as unknown as RouteLocation

        const pageDetails = __test__.getAccountPageDetails(route)
        const expectedRows = [
          'logo',
          'header',
          'subheader',
          'cleverButton',
          'googleButton',
          'orLineBreak',
          'firstName',
          'lastName',
          'password',
          'terms',
          'submitButton',
        ]
        expect(pageDetails.rows.filter((r) => !!r).length).toBe(
          expectedRows.length
        )

        const header = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h1'
        )
        expect(header?.formElement.content).toContain("You're almost done!")

        const subheader = findElementAndRow(
          pageDetails.rows,
          (e) => e.element === 'h2'
        )
        expect(subheader?.formElement.content).toBe(
          `Finish creating your account to join class ${route.params.classCode}`
        )

        const email = findElementAndRow(
          pageDetails.rows,
          (e) => e.props?.name === 'email'
        )
        expect(email).toBeUndefined()
      })
    })

    describe('createAccount', () => {
      beforeEach(() => {
        vi.resetAllMocks()
        localStorage.clear()
        mockedAuthService.registerStudent.mockResolvedValue()
      })

      test('registers student with correct data', async () => {
        const data = {
          firstName: 'MeowFirst',
          lastName: 'MeowLast',
          email: 'student@student.org',
          password: 'Password123', // pragma: allowlist secret
          gradeLevel: '10th',
          schoolId: 'school-id-000',
          zipCode: '00000',
        }
        const result = await __test__.createAccount(data)

        expect(mockedAuthService.registerStudent).toHaveBeenCalledWith({
          email: data.email,
          firstName: data.firstName,
          gradeLevel: data.gradeLevel,
          lastName: data.lastName,
          password: data.password,
          referredByCode: null,
          schoolId: data.schoolId,
          zipCode: data.zipCode,
        })

        expect(result[0]).toEqual({
          path: '/verify',
        })
        expect(result[1]).toBeNull()
      })

      test('registers parent/guardian student with correct data', async () => {
        const data = {
          firstName: 'BarkFirst',
          lastName: 'BarkLast',
          parentGuardianEmail: 'pg@gpg.com',
          email: 'student@pg.com',
          parent: 'true',
          gradeLevel: '8th',
          schoolId: 'school-id-999',
        }

        const result = await __test__.createAccount(data)

        expect(mockedAuthService.registerStudent).toHaveBeenCalledWith({
          firstName: data.firstName,
          gradeLevel: data.gradeLevel,
          lastName: data.lastName,
          parentGuardianEmail: data.parentGuardianEmail,
          email: data.email,
          referredByCode: null,
          schoolId: data.schoolId,
        })

        expect(result[0]).toEqual({
          params: {
            ...data,
            step: 'confirmation',
          },
        })
      })

      test('handles referral code', async () => {
        const referralCode = 'this-is-my-referral-code'
        localStorage.setItem('upcReferredByCode', referralCode)

        const data = {
          firstName: 'FriendsFirst',
          lastName: 'FriendsLast',
          email: 'referral@referral.com',
          password: 'Password123', // pragma: allowlist secret
        }

        await __test__.createAccount(data)

        expect(mockedAuthService.registerStudent).toHaveBeenCalledWith(
          expect.objectContaining({
            referredByCode: referralCode,
          })
        )
        expect(localStorage.getItem('upcReferredByCode')).toBeNull()
      })

      test('handles registration error', async () => {
        const error = { response: { data: { err: 'Registration failed' } } }
        mockedAuthService.registerStudent.mockRejectedValue(error)

        const data = {
          firstName: 'ErrorFirst',
          lastName: 'ErrorLast',
          email: 'test@example.com',
          password: 'Password123', // pragma: allowlist secret
        }

        const result = await __test__.createAccount(data)

        expect(result[0]).toBeNull()
        expect(result[1]).toBe('Registration failed')
      })

      test('redirects to login if email already in use', async () => {
        const error = {
          response: {
            data: {
              err: 'The email address you entered is already in use',
            },
          },
        }
        mockedAuthService.registerStudent.mockRejectedValue(error)
        const routerReplaceSpy = vi
          .spyOn(router, 'replace')
          .mockImplementation(() => Promise.resolve())

        const data = {
          firstName: 'Existing',
          lastName: 'Account',
          email: 'existing@account.com',
          password: 'Password123', // pragma: allowlist secret
        }
        const result = await __test__.createAccount(data)

        expect(routerReplaceSpy).toHaveBeenCalledWith(
          expect.stringContaining('/login?message=')
        )
        expect(result[0]).toBeNull()
        expect(result[1]).toBe(
          'The email address you entered is already in use'
        )

        routerReplaceSpy.mockRestore()
      })
    })
  })

  describe('beforeEnter navigation guard', () => {
    const next = vi.fn() as unknown as NavigationGuardNext

    beforeEach(() => {
      vi.resetAllMocks()
      mockedNetworkService.checkIpAddress.mockResolvedValue(true)
    })

    test('redirects to eligibility page if starting from a different step and no error/international', async () => {
      const to = {
        name: 'SignupView',
        params: { step: 'account', userType: UserType.student },
        query: {},
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'SignupView',
        params: { step: 'eligibility', userType: UserType.student },
        query: {},
      })
    })

    test('allows access to eligibility page', async () => {
      const to = {
        name: 'SignupView',
        params: { step: 'eligibility', userType: UserType.student },
        query: {},
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(next).toHaveBeenCalledWith()
    })

    test('allows access to international page if redirected', async () => {
      const to = {
        name: 'SignupView',
        params: { step: 'international', userType: UserType.student },
        redirectedFrom: { params: { step: 'eligibility' } },
        query: {},
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(next).toHaveBeenCalledWith()
    })

    test('allows access to account page if error', async () => {
      const to = {
        name: 'SignupView',
        params: { step: 'account', userType: UserType.student },
        query: { error: 'some-error' },
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(next).toHaveBeenCalledWith()
    })

    test('processes query parameters from join-class', async () => {
      const to = {
        name: 'SignupView',
        params: { step: 'account', userType: UserType.student },
        query: {
          classCode: 'ABC123',
          email: 'student@join-class.com',
          gradeLevel: '10th',
        },
      } as unknown as RouteLocationNormalized
      const from = {
        name: 'JoinClassView',
        path: '/join-class',
      } as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(to.params.classCode).toBe('ABC123')
      expect(to.params.email).toBe('student@join-class.com')
      expect(to.params.gradeLevel).toBe('10th')
      expect(to.query.classCode).toBeUndefined()
      expect(to.query.email).toBeUndefined()
      expect(to.query.gradeLevel).toBeUndefined()
      expect(next).toHaveBeenCalledWith()
    })

    test('processes/sanitizes query parameter for parent/guardian flow', async () => {
      const to = {
        name: 'SignupView',
        params: { step: 'eligibility', userType: UserType.student },
        query: { parent: 'true' },
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to as any, from as any, next)

      expect(to.params.parent).toBe('true')
      expect(next).toHaveBeenCalledWith()
    })

    test('processes partner query parameter and gets partner data', async () => {
      mockedNetworkService.getStudentPartner = vi.fn().mockResolvedValue({
        data: {
          studentPartner: {
            key: 'test-partner',
            name: 'Test Partner',
            sites: ['Site 1', 'Site 2'],
            isSchool: false,
            schoolSignupRequired: true,
            deactivated: false,
          },
        },
      })

      const to = {
        name: 'SignupView',
        params: { step: 'eligibility', userType: UserType.student },
        query: { partner: 'test-partner' },
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(mockedNetworkService.getStudentPartner).toHaveBeenCalledWith(
        'test-partner'
      )
      expect(to.params.studentPartnerOrgKey).toBe('test-partner')
      expect(to.params.studentPartnerSites).toEqual(['Site 1', 'Site 2'])
      expect(to.params.studentPartnerIsSchool).toBe('false')
      expect(to.params.schoolSignupRequired).toBe('true')
      expect(next).toHaveBeenCalledWith()
    })

    test('handles deactivated partner', async () => {
      mockedNetworkService.getStudentPartner.mockResolvedValue({
        data: {
          studentPartner: {
            key: 'deactivated-partner',
            deactivated: true,
          },
        },
      })

      const to = {
        name: 'SignupView',
        params: { step: 'eligibility', userType: UserType.student },
        query: { partner: 'deactivated-partner' },
        path: '/sign-up/student/eligibility',
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(to.query.partner).toBeUndefined()
      expect(next).toHaveBeenCalledWith({
        path: '/sign-up/student/eligibility',
        query: {},
        params: { step: 'eligibility', userType: UserType.student },
      })
    })

    test('handles non-existent partner', async () => {
      const networkError = { status: 422 }
      mockedNetworkService.getStudentPartner.mockRejectedValue(networkError)

      const to = {
        name: 'SignupView',
        params: { step: 'eligibility', userType: UserType.student },
        query: { partner: 'non-existent' },
        path: '/sign-up/student/eligibility',
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(to.query.partner).toBeUndefined()
      expect(next).toHaveBeenCalledWith({
        path: '/sign-up/student/eligibility',
        query: {},
        params: { step: 'eligibility', userType: UserType.student },
      })
    })

    test('redirects to international page if IP check fails', async () => {
      mockedNetworkService.checkIpAddress.mockRejectedValue(
        new Error('Not in US')
      )

      const to = {
        name: 'SignupView',
        params: { step: 'eligibility', userType: UserType.student },
        query: {},
      } as unknown as RouteLocationNormalized
      const from = {} as unknown as RouteLocationNormalized

      await beforeEnter(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'SignupView',
        params: { step: 'international', userType: UserType.student },
      })
    })
  })
})
