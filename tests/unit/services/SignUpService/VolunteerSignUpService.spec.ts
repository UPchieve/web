import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest'
import * as VolunteerSignUpService from '../../../../src/services/SignUpService/VolunteerSignUpService'
import NetworkService from '../../../../src/services/NetworkService'
import { faker } from '@faker-js/faker'

vi.mock('../../../../src/services/NetworkService')

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
