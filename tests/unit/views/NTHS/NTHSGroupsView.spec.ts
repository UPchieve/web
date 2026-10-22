import NTHSGroupsView from '@/views/NTHS/NTHSGroupsView.vue'
import { VolunteerOccupations } from '@/services/VolunteerService'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import ModalService from '@/services/ModalService'
import NetworkService from '@/services/NetworkService'
import userModule, { type UserStoreState } from '@/store/modules/user'
import { createStore, type Store } from 'vuex'
import { h } from 'vue'

type UserOverrides = {
  occupation?: string[] | null
  isReadyToTutor?: boolean
}

function storeFor(roleName: string, userOverrides: UserOverrides = {}) {
  return createStore({
    state: {
      nths: {
        NTHSGroups: [
          {
            groupInfo: { id: 'group-123', name: 'Test Chapter' },
            memberInfo: { roleName },
          },
        ],
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
  })
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

describe('NTHSGroupsView', () => {
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
})
