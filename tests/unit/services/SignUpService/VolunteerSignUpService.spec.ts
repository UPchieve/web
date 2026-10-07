import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest'
import * as VolunteerSignUpService from '@/services/SignUpService/VolunteerSignUpService'
import NetworkService, { NetworkError } from '@/services/NetworkService'
import { faker } from '@faker-js/faker'
import LoggerService from '@/services/LoggerService'
import { signInWithSso } from '@/services/SsoService'
import { START_LOCATION, createMemoryHistory, createRouter } from 'vue-router'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

vi.mock('@/services/NetworkService')
vi.mock('@/services/SsoService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/SsoService')>()),
  signInWithSso: vi.fn(),
}))

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

describe('Google sign-up referrals', () => {
  const LOCAL_STORAGE_KEY = 'upcReferredByCode'

  afterEach(() => {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
  })

  it('passes the stored referral code into the SSO registration', async () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, 'PERSON123')
    const pageDetails = await VolunteerSignUpService.getPageDetails({
      path: '/sign-up/volunteer/account',
      fullPath: '/sign-up/volunteer/account',
      query: {},
    } as any)
    const googleButton = pageDetails.rows
      .flatMap((row) => row?.elements ?? [])
      .find((element) => element.element === 'SsoButton')

    if (!googleButton || !('submitAction' in googleButton)) {
      throw new Error('Google SSO button not found')
    }
    await googleButton.submitAction({})

    expect(signInWithSso).toHaveBeenCalledWith(
      expect.objectContaining({ referredByCode: 'PERSON123' })
    )
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

const PARTNER_KEY = 'big-telecom'
const INVITE_CODE = 'ABC123'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/sign-up/:userType?/:step?', component: {} }],
})

function resolve(path: string) {
  return router.resolve(path) as RouteLocationNormalized
}

describe('beforeEnter', () => {
  const next = vi.fn() as unknown as NavigationGuardNext

  it.each([
    ['/sign-up/volunteer/about', '/sign-up/volunteer/account', {}],
    [
      `/sign-up/volunteer/about?partnerKey=${PARTNER_KEY}`,
      '/sign-up/volunteer',
      { partnerKey: PARTNER_KEY },
    ],
    [
      `/sign-up/volunteer/about?inviteCode=${INVITE_CODE}`,
      '/sign-up/volunteer/account',
      { inviteCode: INVITE_CODE },
    ],
    ['/sign-up/volunteer', '/sign-up/volunteer/account', {}],
  ])('sends an entry to %s to %s', async (path, firstStep, query) => {
    await VolunteerSignUpService.beforeEnter(
      resolve(path),
      { name: 'LoginView' } as RouteLocationNormalized,
      next
    )
    expect(next).toHaveBeenCalledWith({ path: firstStep, query })
  })

  it.each([
    ['a fresh load of the account step', '/sign-up/volunteer/account', {}],
    [
      'a fresh load of a partner link',
      `/sign-up/volunteer?utm_source=email&partnerId=${PARTNER_KEY}`,
      {},
    ],
  ])('lets %s through', async (_, path, from) => {
    await VolunteerSignUpService.beforeEnter(
      resolve(path),
      from as RouteLocationNormalized,
      next
    )
    expect(next).toHaveBeenCalledWith()
  })

  it('moves an invite code without an email into params without blanking the email', async () => {
    const to = resolve(`/sign-up/volunteer/account?inviteCode=${INVITE_CODE}`)
    await VolunteerSignUpService.beforeEnter(to, START_LOCATION, next)
    expect(to.params).toEqual(
      expect.objectContaining({ inviteCode: INVITE_CODE })
    )
    expect(to.params).not.toHaveProperty('email')
  })
})

describe('getPageDetails', () => {
  beforeEach(() => {
    mockedNetworkService.getVolunteerPartner.mockResolvedValue({
      data: { volunteerPartner: { name: 'Big Telecom' } },
    } as any)
  })

  it.each([
    `/sign-up/volunteer?partnerKey=${PARTNER_KEY}`,
    `/sign-up/volunteer?partnerId=${PARTNER_KEY}`,
    `/sign-up/volunteer?utm_source=email&partnerKey=${PARTNER_KEY}`,
  ])('shows the partner page for %s', async (path) => {
    await VolunteerSignUpService.getPageDetails(resolve(path) as any)
    expect(mockedNetworkService.getVolunteerPartner).toHaveBeenCalledWith(
      PARTNER_KEY
    )
  })

  it.each([
    ['partner link', { partnerId: PARTNER_KEY }, { partnerKey: PARTNER_KEY }],
    ['team invite', { inviteCode: INVITE_CODE }, { inviteCode: INVITE_CODE }],
    ['open sign-up', {}, {}],
  ])(
    'carries the %s into the about step URL and keeps the email out',
    async (_, routeData, query) => {
      mockedNetworkService.checkRegister.mockResolvedValue({} as any)
      const details = await VolunteerSignUpService.getPageDetails(
        resolve('/sign-up/volunteer/account') as any
      )
      const [nextLocation] = await details.submitAction({
        email: 'volunteer@example.com',
        password: 'Password123',
        ...routeData,
      })
      expect(nextLocation).toEqual({ params: { step: 'about' }, query })
    }
  )
})

describe('createAccount without credentials', () => {
  it.each([
    [
      { partnerKey: PARTNER_KEY },
      '/sign-up/volunteer',
      { partnerKey: PARTNER_KEY },
    ],
    [
      { inviteCode: INVITE_CODE },
      '/sign-up/volunteer/account',
      { inviteCode: INVITE_CODE },
    ],
    [{}, '/sign-up/volunteer/account', {}],
  ])('sends %j to %s without registering', async (data, path, query) => {
    const [location] = await VolunteerSignUpService.createAccount(
      data as VolunteerSignUpService.VolunteerAccountFormData
    )
    expect(location).toEqual({ path, query })
    expect(mockedNetworkService.registerOpenVolunteer).not.toHaveBeenCalled()
    expect(mockedNetworkService.registerPartnerVolunteer).not.toHaveBeenCalled()
  })
})

describe('createAccount registration endpoint', () => {
  it('registers under the partner', async () => {
    await VolunteerSignUpService.createAccount({
      email: 'volunteer@example.com',
      password: 'Password123',
      partnerKey: PARTNER_KEY,
    })
    expect(mockedNetworkService.registerPartnerVolunteer).toHaveBeenCalledWith(
      expect.objectContaining({ volunteerPartnerOrg: PARTNER_KEY })
    )
  })
})
