import NTHSGroupsView from '@/views/NTHS/NTHSGroupsView.vue'
import { VolunteerOccupations } from '@/services/VolunteerService'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ModalService from '@/services/ModalService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import userModule, { type UserStoreState } from '@/store/modules/user'
import { createStore, type Store } from 'vuex'
import { h } from 'vue'
import { useAppModalStore } from '@/stores/app/modal'

type UserOverrides = {
  occupation?: string[] | null
  isReadyToTutor?: boolean
  renewalPrompt?: string
}

const fetchNthsData = vi.fn()
const refreshNTHSGroups = vi.fn()

function storeFor(roleName: string, userOverrides: UserOverrides = {}) {
  return createStore({
    state: {
      nths: {
        NTHSGroups: [
          {
            groupInfo: { id: 'group-123', name: 'Test Chapter' },
            memberInfo: { roleName },
            renewal: userOverrides.renewalPrompt
              ? {
                  prompt: userOverrides.renewalPrompt,
                  closesOn: '2027-09-30',
                  successorConfirmationOn: '2027-08-01',
                  namingClosesOn: '2027-09-14',
                  commitmentsRequired: true,
                  canNameSelf: true,
                  namingSelfAccepts: false,
                }
              : undefined,
          },
        ],
        NTHSRenewalSuccessors: {},
      },
      // A member who isn't a high-school student or isn't ready to tutor has
      // the whole tab strip hidden behind a callout, which is a separate gate
      // from admin/member tab visibility - keep it out of the way here.
      user: {
        user: {
          id: 'user-1',
          occupation:
            userOverrides.occupation === undefined
              ? [VolunteerOccupations.HIGH_SCHOOL_STUDENT]
              : userOverrides.occupation,
        },
      },
    },
    getters: {
      'user/isVolunteerInHighSchool': (state) =>
        userModule.getters.isVolunteerInHighSchool(
          state.user as unknown as UserStoreState
        ),
      'volunteer/isReadyToTutor': () => userOverrides.isReadyToTutor ?? true,
      'nths/hasAdminRole': () => roleName === 'admin',
    },
    mutations: {
      setOccupation(state, occupation) {
        state.user.user.occupation = occupation
      },
    },
    actions: {
      'nths/fetchNthsData': fetchNthsData,
      'nths/refreshNTHSGroups': refreshNTHSGroups,
    },
  })
}

function removeCoachFromChapter({
  state,
}: {
  state: { nths: { NTHSGroups: unknown[] } }
}) {
  state.nths.NTHSGroups = []
  return []
}

async function getWrapper(
  initialPath: string,
  roleName = 'admin',
  userOverrides: UserOverrides = {}
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', component: { template: '<div />' } },
      { path: '/groups/home', component: { template: '<div />' } },
      { path: '/groups/to-do', component: { template: '<div />' } },
      {
        // This test asserts on the routed view's content, so it needs a
        // render function; a template-string stub renders nothing without a
        // runtime template compiler, unlike the untested route stubs above.
        path: '/groups/members',
        component: {
          render: () => h('div', { 'data-testid': 'routed-members' }),
        },
      },
      { path: '/groups/resources', component: { template: '<div />' } },
      { path: '/groups/setup', component: { template: '<div />' } },
    ],
  })
  router.push(initialPath)
  await router.isReady()

  const wrapper = mount(NTHSGroupsView, {
    global: { plugins: [storeFor(roleName, userOverrides), router] },
  })
  await flushPromises()
  return wrapper
}

enableAutoUnmount(afterEach)

describe('NTHSGroupsView', () => {
  beforeEach(() => {
    fetchNthsData.mockReset()
    refreshNTHSGroups.mockReset().mockResolvedValue([{}])
    useAppModalStore().hide()
    vi.restoreAllMocks()
  })

  it.each([
    { role: 'member', shows: ['/groups/members'], hides: ['/groups/to-do'] },
    { role: 'admin', shows: ['/groups/members', '/groups/to-do'], hides: [] },
  ])('shows $role the right tabs', async ({ role, shows, hides }) => {
    const wrapper = await getWrapper('/groups/home', role)

    const hrefs = wrapper
      .findAll('nav.tabs a')
      .map((tab) => tab.attributes('href'))
    for (const href of shows) expect(hrefs).toContain(href)
    for (const href of hides) expect(hrefs).not.toContain(href)
  })

  // This gate is the only thing on the client stopping an uncleared member
  // from rendering the tab strip or the routed view; the router applies no
  // guard of its own to /groups/members.
  describe('the page content gate', () => {
    it.each([
      {
        name: 'a plain member with no high-school occupation',
        role: 'member',
        overrides: { occupation: [] },
        hidden: true,
      },
      {
        name: 'a plain member who is not ready to tutor',
        role: 'member',
        overrides: { isReadyToTutor: false },
        hidden: true,
      },
      {
        name: 'an admin with no high-school occupation',
        role: 'admin',
        overrides: { occupation: [] },
        hidden: true,
      },
      {
        name: 'an admin with high school who is not ready to tutor',
        role: 'admin',
        overrides: { isReadyToTutor: false },
        hidden: false,
      },
    ])(
      'gates the tabs and routed view behind a warning for $name',
      async ({ role, overrides, hidden }) => {
        const wrapper = await getWrapper('/groups/members', role, overrides)

        expect(wrapper.find('[data-testid="hide-page-content"]').exists()).toBe(
          hidden
        )
        expect(wrapper.find('nav.tabs').exists()).toBe(!hidden)
        expect(wrapper.find('[data-testid="routed-members"]').exists()).toBe(
          !hidden
        )
      }
    )
  })

  describe('the high school notice', () => {
    // A plain member is also not ready to tutor here: the high school notice
    // must win over the onboarding one.
    const roles = [
      { role: 'admin', ready: {} },
      { role: 'member', ready: { isReadyToTutor: false } },
    ]
    it.each(
      [
        {
          name: 'no occupation',
          overrides: { occupation: [] },
          text: "We don't have your occupation on file yet",
          button: 'Add background info',
          path: '/background-information',
        },
        {
          name: 'a missing occupation',
          overrides: { occupation: null },
          text: "We don't have your occupation on file yet",
          button: 'Add background info',
          path: '/background-information',
        },
        {
          name: 'occupations without high school',
          overrides: { occupation: [VolunteerOccupations.UNDERGRAD_STUDENT] },
          text: "Your profile says you're not in high school",
          button: 'Update profile',
          path: '/profile',
        },
      ].flatMap((c) => roles.map((r) => ({ ...c, ...r })))
    )(
      'offers the right link and leaving to a $role with $name',
      async ({ role, ready, overrides, text, button, path }) => {
        const wrapper = await getWrapper('/groups/home', role, {
          ...overrides,
          ...ready,
        })
        const notice = wrapper.get('[data-testid="hide-page-content"]')
        expect(notice.text()).toContain(text)
        expect(notice.text()).not.toMatch(/removed/i)

        const buttons = notice.findAll('button')
        expect(buttons.map((b) => b.text())).toEqual([button, 'Leave chapter'])
        await buttons[0].trigger('click')
        await flushPromises()
        expect(wrapper.vm.$router.currentRoute.value.path).toBe(path)
      }
    )

    it('opens the self-leave confirmation without fetching members', async () => {
      const spy = vi
        .spyOn(ModalService, 'showLeaveTeamModal')
        .mockImplementation(() => undefined as never)
      const fetchMembers = vi.spyOn(NetworkService, 'getNTHSGroupMembers')
      const wrapper = await getWrapper('/groups/home', 'admin', {
        occupation: [],
      })
      await wrapper.findAll('button')[1].trigger('click')
      expect(spy).toHaveBeenCalledWith({
        isRemovingSelf: true,
        memberToRemove: { userId: 'user-1', nthsGroupId: 'group-123' },
      })
      expect(fetchMembers).not.toHaveBeenCalled()
    })

    it('clears the notice once a high school occupation is saved', async () => {
      const wrapper = await getWrapper('/groups/members', 'member', {
        occupation: [],
      })
      expect(wrapper.find('[data-testid="hide-page-content"]').exists()).toBe(
        true
      )
      const { $store } = wrapper.vm as unknown as { $store: Store<unknown> }
      $store.commit('setOccupation', [VolunteerOccupations.HIGH_SCHOOL_STUDENT])
      await flushPromises()

      expect(wrapper.find('[data-testid="hide-page-content"]').exists()).toBe(
        false
      )
      expect(wrapper.find('[data-testid="routed-members"]').exists()).toBe(true)
    })
  })

  describe('renewal', () => {
    it('refreshes the chapter list on mount and on each tab change', async () => {
      const wrapper = await getWrapper('/groups/home')
      expect(refreshNTHSGroups).toHaveBeenCalledTimes(1)

      await wrapper.vm.$router.push('/groups/members')
      await flushPromises()
      await wrapper.vm.$router.push('/groups/home')
      await flushPromises()

      expect(refreshNTHSGroups).toHaveBeenCalledTimes(3)
      expect(fetchNthsData).not.toHaveBeenCalled()
    })

    it('refreshes the chapter list when the coach comes back to the browser tab', async () => {
      await getWrapper('/groups/home')
      const visibilityState = vi.spyOn(document, 'visibilityState', 'get')

      for (const state of ['hidden', 'visible'] as const) {
        visibilityState.mockReturnValue(state)
        document.dispatchEvent(new Event('visibilitychange'))
        await flushPromises()
      }

      expect(refreshNTHSGroups).toHaveBeenCalledTimes(2)
    })

    it('moves a coach removed from the chapter off Chapter HQ on the next tab change', async () => {
      const wrapper = await getWrapper('/groups/home')
      refreshNTHSGroups.mockImplementation(removeCoachFromChapter)

      await wrapper.vm.$router.push('/groups/members')
      await flushPromises()

      expect(fetchNthsData).toHaveBeenCalled()
      expect(wrapper.vm.$router.currentRoute.value.path).toBe('/dashboard')
    })

    it('leaves the route alone when the view unmounts before the refresh lands', async () => {
      let finishRefresh: () => void = () => undefined
      refreshNTHSGroups.mockImplementation(
        (context) =>
          new Promise((resolve) => {
            finishRefresh = () => resolve(removeCoachFromChapter(context))
          })
      )
      const wrapper = await getWrapper('/groups/home')
      const replace = vi.spyOn(wrapper.vm.$router, 'replace')

      wrapper.unmount()
      finishRefresh()
      await flushPromises()

      expect(replace).not.toHaveBeenCalled()
    })

    it('logs a failed refresh and stays on the page', async () => {
      const noticeError = vi
        .spyOn(LoggerService, 'noticeError')
        .mockImplementation(() => undefined)
      refreshNTHSGroups.mockRejectedValue(new Error('network'))

      const wrapper = await getWrapper('/groups/home')

      expect(noticeError).toHaveBeenCalled()
      expect(wrapper.vm.$router.currentRoute.value.path).toBe('/groups/home')
    })

    it('skips the reminder when another modal is already open', async () => {
      const showReminder = vi
        .spyOn(ModalService, 'showNthsSuccessorPicker')
        .mockImplementation(() => undefined)
      useAppModalStore().show()

      await getWrapper('/groups/home', 'admin', {
        renewalPrompt: 'name-successor-reminder',
      })

      expect(showReminder).not.toHaveBeenCalled()
    })

    it('skips the reminder when the view unmounts before the refresh lands', async () => {
      const showReminder = vi
        .spyOn(ModalService, 'showNthsSuccessorPicker')
        .mockImplementation(() => undefined)
      let finishRefresh: (groups: unknown[]) => void = () => undefined
      refreshNTHSGroups.mockReturnValue(
        new Promise<unknown[]>((resolve) => {
          finishRefresh = resolve
        })
      )
      const wrapper = await getWrapper('/groups/home', 'admin', {
        renewalPrompt: 'name-successor-reminder',
      })

      wrapper.unmount()
      finishRefresh([{}])
      await flushPromises()

      expect(showReminder).not.toHaveBeenCalled()
    })

    it.each([
      {
        name: 'the reminder prompt',
        prompt: 'name-successor-reminder',
        overrides: {},
        opens: true,
      },
      {
        name: 'the May banner prompt',
        prompt: 'name-successor-banner',
        overrides: {},
        opens: false,
      },
      {
        name: 'the reminder prompt behind the high school notice',
        prompt: 'name-successor-reminder',
        overrides: { occupation: [] },
        opens: false,
      },
    ])(
      'opens the reminder once per mount for $name: $opens',
      async ({ prompt, overrides, opens }) => {
        const showReminder = vi
          .spyOn(ModalService, 'showNthsSuccessorPicker')
          .mockImplementation(() => undefined)
        const wrapper = await getWrapper('/groups/home', 'admin', {
          ...overrides,
          renewalPrompt: prompt,
        })
        await wrapper.vm.$router.push('/groups/members')
        await flushPromises()

        expect(showReminder).toHaveBeenCalledTimes(opens ? 1 : 0)
        if (opens) {
          expect(showReminder).toHaveBeenCalledWith({
            groupId: 'group-123',
            asReminder: true,
          })
        }
      }
    )

    it('shows the renewal banner only with the page content', async () => {
      vi.spyOn(ModalService, 'showNthsSuccessorPicker').mockImplementation(
        () => undefined
      )
      const shown = await getWrapper('/groups/home', 'admin', {
        renewalPrompt: 'name-successor-reminder',
      })
      const gated = await getWrapper('/groups/home', 'admin', {
        renewalPrompt: 'name-successor-reminder',
        occupation: [],
      })

      expect(shown.find('[data-testid="renewal-banner"]').exists()).toBe(true)
      expect(gated.find('[data-testid="renewal-banner"]').exists()).toBe(false)
    })
  })
})
