import { beforeEach, describe, expect, test, vi } from 'vitest'
import { __test__ } from '@/services/SignUpService/StudentSignUpService'
import * as SignUpService from '@/services/SignUpService'
import NetworkService from '@/services/NetworkService'

vi.mock('@/services/NetworkService')
vi.mock('@/services/AnalyticsService')
const mockedNetworkService = vi.mocked(NetworkService)

describe('StudentSignUpService', () => {
  describe('Eligibility', () => {
    describe('checkEligibility', () => {
      const INELIGIBILITY_KEY =
        SignUpService.__test__.createEligibilityCheckKey(
          SignUpService.UserType.student
        )

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
        const data = { gradeLevel: '12th', schoolId: 'school-789' }

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
        const data = { gradeLevel: 'College', schoolId: 'school-101' }

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
})
