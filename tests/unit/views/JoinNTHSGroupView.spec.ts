import JoinNTHSGroupView from '@/views/JoinNTHSGroupView.vue'
import NetworkService from '@/services/NetworkService'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
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
    authStatus: vi.fn(),
    getNTHSGroupByCode: vi.fn(),
    joinVolunteerToNTHSGroup: vi.fn(),
  },
}))

const mockedNetworkService = vi.mocked(NetworkService)

const mountView = (
  user: Record<string, unknown> = {},
  userOnServer: Record<string, unknown> = {}
) =>
  mount(JoinNTHSGroupView, {
    global: {
      plugins: [
        createStore({
          state: { nths: { NTHSGroups: [] } },
          modules: {
            user: {
              namespaced: true,
              state: { user },
              actions: {
                fetchUser({ state }) {
                  state.user = userOnServer
                },
              },
            },
          },
        }),
      ],
      stubs: {
        FormPageTemplate: {
          render() {
            return h('div', this.$slots.default?.())
          },
        },
        Loader: true,
        FormErrors: true,
        FormInput: true,
        FormEmail: true,
      },
    },
  })

describe('JoinNTHSGroupView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedNetworkService.authStatus.mockResolvedValue({
      authenticated: false,
    } as any)
    mockedNetworkService.getNTHSGroupByCode.mockResolvedValue({
      data: { NTHSGroup: { name: 'Test Chapter' } },
    } as any)
    mockedNetworkService.joinVolunteerToNTHSGroup.mockResolvedValue({
      data: { isExistingVolunteer: false },
    } as any)
  })

  it('preserves the inviter referral code when sending a new member to sign up', async () => {
    mountView()
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

  it('shows the join form for an open chapter', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="chapter-closed"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="button-submit"]').exists()).toBe(true)
  })

  describe('closed chapter', () => {
    beforeEach(() => {
      mockedNetworkService.getNTHSGroupByCode.mockResolvedValue({
        data: {
          NTHSGroup: {
            name: 'Test Chapter',
            closedAt: '2026-06-15T12:00:00.000Z',
          },
        },
      } as any)
    })

    it('says the chapter closed instead of showing the join form', async () => {
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.text()).toContain('This chapter has closed')
      expect(wrapper.text()).toContain(
        "Test Chapter has closed and isn't accepting new members."
      )
      expect(wrapper.find('[data-testid="button-submit"]').exists()).toBe(false)
      expect(
        mockedNetworkService.joinVolunteerToNTHSGroup
      ).not.toHaveBeenCalled()
    })

    it.each([
      [
        'a signed-in visitor',
        { id: 'user-1' },
        'button-go-to-dashboard',
        '/dashboard',
      ],
      [
        'a signed-out visitor, keeping the inviter referral code,',
        {},
        'button-sign-up',
        { path: '/sign-up/volunteer', query: { referral: 'PERSON123' } },
      ],
    ])('sends %s to the right page', async (_, user, testid, path) => {
      const wrapper = mountView(user)
      await flushPromises()

      await wrapper.find(`[data-testid="${testid}"]`).trigger('click')

      expect(push).toHaveBeenCalledWith(path)
    })

    it('offers the dashboard to a signed-in coach who opened the link directly', async () => {
      mockedNetworkService.authStatus.mockResolvedValue({
        authenticated: true,
      } as any)
      const wrapper = mountView(
        {},
        { id: 'user-1', email: 'coach@example.com' }
      )
      await flushPromises()

      expect(
        wrapper.find('[data-testid="button-go-to-dashboard"]').exists()
      ).toBe(true)
      expect(wrapper.find('[data-testid="button-sign-up"]').exists()).toBe(
        false
      )
    })

    it('shows the code form when the visitor says it is not their team', async () => {
      const wrapper = mountView()
      await flushPromises()

      await wrapper.find('[data-testid="link-not-your-team"]').trigger('click')

      expect(wrapper.find('[data-testid="chapter-closed"]').exists()).toBe(
        false
      )
      expect(wrapper.findComponent({ name: 'FormInput' }).exists()).toBe(true)
    })
  })
})
