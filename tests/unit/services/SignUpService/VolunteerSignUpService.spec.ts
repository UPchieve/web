import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest'
import * as VolunteerSignUpService from '@/services/SignUpService/VolunteerSignUpService'
import NetworkService, { NetworkError } from '@/services/NetworkService'
import { faker } from '@faker-js/faker'
import LoggerService from '@/services/LoggerService'

vi.mock('@/services/NetworkService')

const mockedNetworkService = vi.mocked(NetworkService)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('createAccount', () => {
  describe('Referrals', () => {
    const LOCAL_STORAGE_KEY = 'upcReferredByCode'

    afterEach(() => {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    })
    const createAccountData = {
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password(),
      phone: faker.phone.number(),
      terms: true,
      inviteCode: '1',
    }

    it('Sends null referral code when there is no local storage value', async () => {
      await VolunteerSignUpService.createAccount(createAccountData)
      expect(mockedNetworkService.registerOpenVolunteer).toHaveBeenCalledWith(
        expect.objectContaining({
          referredByCode: null,
        })
      )
    })

    it('Passes along the referral code value from local storage if it is present', async () => {
      const referredByCode = 'ABC123'
      window.localStorage.setItem(LOCAL_STORAGE_KEY, referredByCode)
      await VolunteerSignUpService.createAccount(createAccountData)
      expect(mockedNetworkService.registerOpenVolunteer).toHaveBeenCalledWith(
        expect.objectContaining({
          referredByCode,
        })
      )
    })
  })
})

describe('checkRegister error handling', () => {
  const accountRoute = {
    path: '/sign-up/volunteer/account',
    fullPath: '/sign-up/volunteer/account',
    query: {},
  } as any
  const accountData = {
    email: 'volunteer@example.com',
    password: 'password',
  }

  it.each([409, 422])(
    'shows an expected %s error without logging it',
    async (status) => {
      const error = new NetworkError('Invalid credentials', { status })
      mockedNetworkService.checkRegister.mockRejectedValue(error)
      const logError = vi
        .spyOn(LoggerService, 'noticeError')
        .mockImplementation(() => {})
      const pageDetails =
        await VolunteerSignUpService.getPageDetails(accountRoute)

      await expect(pageDetails.submitAction(accountData)).resolves.toEqual([
        null,
        error.message,
      ])
      expect(logError).not.toHaveBeenCalled()
    }
  )

  it('logs an unexpected network error', async () => {
    const error = new NetworkError('Server error', { status: 500 })
    mockedNetworkService.checkRegister.mockRejectedValue(error)
    const logError = vi
      .spyOn(LoggerService, 'noticeError')
      .mockImplementation(() => {})
    const pageDetails =
      await VolunteerSignUpService.getPageDetails(accountRoute)

    await expect(pageDetails.submitAction(accountData)).resolves.toEqual([
      null,
      error.message,
    ])
    expect(logError).toHaveBeenCalledWith(error)
  })
})
