import JoinNTHSGroupView from '@/views/JoinNTHSGroupView.vue'
import NetworkService from '@/services/NetworkService'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

const push = vi.fn()

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({
    params: { inviteCode: 'TEAM123' },
    query: { email: 'friend@example.com', referral: 'PERSON123' },
  }),
  useRouter: () => ({ push, replace: vi.fn(), go: vi.fn() }),
}))

vi.mock('@/services/NetworkService', () => ({
  default: {
    getNTHSGroupByCode: vi.fn(),
    joinVolunteerToNTHSGroup: vi.fn(),
  },
}))

const mockedNetworkService = vi.mocked(NetworkService)

describe('JoinNTHSGroupView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedNetworkService.getNTHSGroupByCode.mockResolvedValue({
      data: { NTHSGroup: { name: 'Test Chapter' } },
    } as any)
    mockedNetworkService.joinVolunteerToNTHSGroup.mockResolvedValue({
      data: { isExistingVolunteer: false },
    } as any)
  })

  it('preserves the inviter referral code when sending a new member to sign up', async () => {
    const store = createStore({
      state: {
        user: { user: {} },
        nths: { NTHSGroups: [] },
      },
    })

    mount(JoinNTHSGroupView, {
      global: {
        plugins: [store],
        stubs: {
          FormPageTemplate: { template: '<div><slot /></div>' },
          Loader: true,
          FormErrors: true,
          FormInput: true,
          FormEmail: true,
        },
      },
    })
    await flushPromises()

    expect(push).toHaveBeenCalledWith({
      name: 'SignupView',
      params: { userType: 'volunteer', step: 'account' },
      query: {
        email: 'friend@example.com',
        inviteCode: 'TEAM123',
        referral: 'PERSON123',
      },
    })
  })
})
