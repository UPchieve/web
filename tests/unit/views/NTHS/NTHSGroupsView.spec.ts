import NTHSGroupsView from '@/views/NTHS/NTHSGroupsView.vue'
import { VolunteerOccupations } from '@/services/VolunteerService'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { h } from 'vue'

type UserOverrides = {
  occupation?: string[]
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
          occupation: userOverrides.occupation ?? [
            VolunteerOccupations.HIGH_SCHOOL_STUDENT,
          ],
        },
      },
    },
    getters: {
      'volunteer/isReadyToTutor': () => userOverrides.isReadyToTutor ?? true,
      'nths/hasAdminRole': () => roleName === 'admin',
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

afterEach(() => {
  vi.restoreAllMocks()
})

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
        name: 'an admin in the same uncleared state',
        role: 'admin',
        overrides: { occupation: [], isReadyToTutor: false },
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
})
