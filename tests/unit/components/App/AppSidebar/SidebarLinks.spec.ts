import SidebarLink from '@/components/App/AppSidebar/SidebarLink.vue'
import SidebarLinks from '@/components/App/AppSidebar/SidebarLinks.vue'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'

// General links
const CONTACT_LINK = { to: '/contact', text: 'Contact us' }
const DASHBOARD_LINK = { to: '/dashboard', text: 'Dashboard' }

// Student links
const SESSION_HISTORY_LINK = {
  to: '/sessions/history',
  text: 'Session History',
}
const FAVORITE_COACHES_LINK = {
  to: '/favorite-coaches',
  text: 'Favorite Coaches',
}
const MY_CLASSES_LINK = {
  to: '/classes',
  text: 'My Classes',
}
const MY_JOURNEYS_LINK = {
  to: '/journeys',
  text: 'My Journeys',
}
const MY_CLASSES_LINK_TEACHERS = {
  to: '/dashboard',
  text: 'My Classes',
}

const PROGRESS_REPORTS = {
  text: 'My Progress',
  onClick: () => {},
}

// Volunteer links
const CALENDAR_LINK = { to: '/calendar', text: 'Schedule' }
const TRAINING_LINK = {
  to: '/training',
  text: 'Training',
}
const INVITE_FRIEND_LINK = {
  onClick: () => {},
  text: 'Invite a Friend',
}
const COMMUNITY_LINK = {
  // This link changes. Just match the consistent portion.
  to: 'https://join.slack.com/t/upchieveaccommunity/shared_invite/',
  text: 'Community',
}
// Admin links
const ADMIN_LINK = { to: '/admin', text: 'Admin' }
const NTHS_APPLY_LINK = { to: '/groups/apply', text: 'Apply to NTHS' }
const NTHS_CREATE_TEAM_LINK = { to: '/groups/create', text: 'NTHS Team' }
const NTHS_TEAM_LINK = { to: '/groups', text: 'NTHS Team' }

// Links organized by route & user type. Array indices of the links are important.
const links = {
  default: {
    loggedOut: [],
    student: [
      DASHBOARD_LINK,
      PROGRESS_REPORTS,
      MY_CLASSES_LINK,
      MY_JOURNEYS_LINK,
      FAVORITE_COACHES_LINK,
      SESSION_HISTORY_LINK,
      CONTACT_LINK,
    ],
    volunteer: [
      DASHBOARD_LINK,
      TRAINING_LINK,
      CALENDAR_LINK,
      SESSION_HISTORY_LINK,
      INVITE_FRIEND_LINK,
      CONTACT_LINK,
      COMMUNITY_LINK,
    ],
    admin: [
      DASHBOARD_LINK,
      TRAINING_LINK,
      CALENDAR_LINK,
      SESSION_HISTORY_LINK,
      INVITE_FRIEND_LINK,
      ADMIN_LINK,
      CONTACT_LINK,
      COMMUNITY_LINK,
    ],
    teacher: [MY_CLASSES_LINK_TEACHERS, CONTACT_LINK],
  },
  onboarding: {
    student: [],
    volunteer: [],
  },
}

const getWrapper = (options = {}) => {
  const DEFAULTS = {
    path: '/',
    props: {
      authenticated: false,
      numberOfStudentClasses: 0,
    },
    user: {
      getters: {
        isStudent: () => true,
        isTeacher: () => false,
        isAdmin: () => false,
        isVolunteer: () => false,
        hasCertification: () => false,
        isAutoFlowUser: () => false,
      },
      state: {
        userType: 'student',
        isOnboarded: false,
      },
    },
    nths: {
      state: {
        NTHSGroups: [],
      },
    },
  }

  const store = createStore({
    modules: {
      ...storeOptions.modules,
      user: {
        ...storeOptions.modules.user,
        state: {
          ...storeOptions.modules.user.state,
          ...DEFAULTS.user.state,
          ...(options.user?.state ?? {}),
        },
        getters: {
          ...storeOptions.modules.user.getters,
          ...DEFAULTS.user.getters,
          ...(options.user?.getters ?? {}),
        },
      },
      featureFlags: {
        ...storeOptions.modules.featureFlags,
        getters: {
          ...(options.featureFlags?.getters ?? {}),
        },
      },
      productFlags: {
        ...storeOptions.modules.productFlags,
      },
      nths: {
        ...storeOptions.modules.nths,
        state: {
          ...DEFAULTS.nths.state,
          ...(options.nths?.state ?? {}),
        },
      },
    },
  })

  return shallowMount(SidebarLinks, {
    global: {
      plugins: [store],
      mocks: { $route: { path: options.path ?? DEFAULTS.path, query: {} } },
    },
    props: {
      ...DEFAULTS.props,
      ...(options.props ?? {}),
    },
  })
}

describe('SidebarLinks', () => {
  it('layout', async () => {
    const wrapper = getWrapper({ props: { authenticated: true } })
    expect(wrapper.classes('SidebarLinks')).toBe(true)
    expect(wrapper.findAllComponents(SidebarLink).length).toBeGreaterThan(0)

    const about = wrapper.find('.SidebarLinks-about')
    expect(about.exists()).toBe(true)
    expect(about.text()).toBe('About UPchieve')
  })

  describe('link tests', () => {
    const testLinks = (wrapper, expectedLinks) => {
      const sidebarLinks = wrapper.findAllComponents(SidebarLink)

      expect(sidebarLinks.length).toBe(expectedLinks.length)
      expectedLinks.forEach((link, i) => {
        const sidebarLink = sidebarLinks.at(i)
        if (!link.onClick) {
          expect(sidebarLink.props('to')).toContain(link.to)
        }

        // expect(sidebarLink.contains(link.icon)).toBe(true);
        expect(sidebarLink.props('text')).toBe(link.text)
      })
    }

    it('renders default links when not logged in', () => {
      const wrapper = getWrapper()
      testLinks(wrapper, links.default.loggedOut)
    })

    it('renders default links for student', () => {
      const wrapper = getWrapper({ props: { authenticated: true } })
      testLinks(wrapper, links.default.student)
    })

    it('renders onboarding links for student', () => {
      const wrapper = getWrapper({ path: '/onboarding' })
      testLinks(wrapper, links.onboarding.student)
    })

    it('renders default links for volunteer', () => {
      const wrapper = getWrapper({
        props: { authenticated: true },
        user: {
          getters: {
            isVolunteer: () => true,
            isStudent: () => false,
            hasCertification: () => true,
          },
          state: {
            isOnboarded: true,
          },
        },
      })
      testLinks(wrapper, links.default.volunteer)
    })

    it('does not render any links for an autoflow volunteer', () => {
      const wrapper = getWrapper({
        props: { authenticated: true },
        user: {
          getters: {
            isVolunteer: () => true,
            isStudent: () => false,
            hasCertification: () => false,
            isAutoFlowUser: () => true,
          },
          state: {
            isOnboarded: true,
            roleContext: {
              roles: ['volunteer'],
            },
          },
        },
      })
      testLinks(wrapper, [])
    })
    it('does render links for an student that has a volunteer role (not eligible for autoflow)', () => {
      const wrapper = getWrapper({
        props: { authenticated: true },
        user: {
          state: {
            isOnboarded: false,
            roleContext: {
              roles: ['volunteer', 'student'],
            },
          },
          getters: {
            hasCertification: () => false,
            isVolunteer: () => true,
            isStudent: () => false,
          },
        },
      })
      testLinks(wrapper, links.default.volunteer)
    })

    it('renders onboarding links for volunteer', () => {
      const wrapper = getWrapper({
        user: {
          getters: {
            isVolunteer: () => true,
            isStudent: () => false,
          },
        },
        path: '/onboarding',
      })
      testLinks(wrapper, links.onboarding.volunteer)
    })

    it('renders default links for admin', () => {
      const wrapper = getWrapper({
        user: {
          getters: {
            isAdmin: () => true,
            isVolunteer: () => true,
            isStudent: () => false,
            hasCertification: () => true,
          },
          state: {
            isOnboarded: true,
          },
        },
        props: { authenticated: true },
      })
      testLinks(wrapper, links.default.admin)
    })

    it('renders default links for teacher', () => {
      const wrapper = getWrapper({
        props: { authenticated: true },
        user: {
          getters: {
            isStudent: () => false,
            isTeacher: () => true,
          },
        },
      })
      testLinks(wrapper, links.default.teacher)
    })

    describe('NTHS', () => {
      it('Renders the "Apply Now" link if the user is not an approved president and not in any groups', async () => {
        const wrapper = getWrapper({
          props: {
            authenticated: true,
          },
          user: {
            getters: {
              isStudent: () => false,
              isVolunteer: () => true,
              isTeacher: () => false,
            },
          },
          featureFlags: {
            getters: {
              userIsApprovedNTHSPresident: () => false,
              isNTHSApplicationPageEnabled: () => true,
            },
          },
          volunteer: {
            state: {
              NTHSGroups: [],
            },
          },
        })
        const sidebarLinks = wrapper.findAllComponents(SidebarLink)
        expect(sidebarLinks.length).toBeGreaterThanOrEqual(
          links.default.volunteer.length
        )
        const isTargetLinkPresent = sidebarLinks.some((link) => {
          return (
            link.props('to') === NTHS_APPLY_LINK.to &&
            link.props('text') === NTHS_APPLY_LINK.text
          )
        })
        expect(isTargetLinkPresent).toEqual(true)
      })

      it('Renders the "Create Team" link if the user is an approved president and has no group', async () => {
        const wrapper = getWrapper({
          props: {
            authenticated: true,
          },
          user: {
            getters: {
              isStudent: () => false,
              isVolunteer: () => true,
              isTeacher: () => false,
            },
          },
          featureFlags: {
            getters: {
              userIsApprovedNTHSPresident: () => true,
              isNTHSApplicationPageEnabled: () => false,
            },
          },
        })
        const sidebarLinks = wrapper.findAllComponents(SidebarLink)
        expect(sidebarLinks.length).toBeGreaterThanOrEqual(
          links.default.volunteer.length
        )
        const isTargetLinkPresent = sidebarLinks.some((link) => {
          return (
            link.props('to') === NTHS_CREATE_TEAM_LINK.to &&
            link.props('text') === NTHS_CREATE_TEAM_LINK.text
          )
        })
        expect(isTargetLinkPresent).toEqual(true)
      })

      it.each([true, false])(
        'Renders the "My Team" link if the user is in a group, whether or not (%s) they are an approved president',
        async (isApprovedPresident) => {
          const wrapper = getWrapper({
            props: {
              authenticated: true,
            },
            user: {
              getters: {
                isStudent: () => false,
                isVolunteer: () => true,
                isTeacher: () => false,
              },
            },
            featureFlags: {
              getters: {
                userIsApprovedNTHSPresident: () => isApprovedPresident,
                isNTHSApplicationPageEnabled: () => false,
              },
            },
            nths: {
              state: {
                NTHSGroups: [{ groupId: 123 }],
              },
            },
          })
          const sidebarLinks = wrapper.findAllComponents(SidebarLink)
          expect(sidebarLinks.length).toBeGreaterThanOrEqual(
            links.default.volunteer.length
          )
          const isTargetLinkPresent = sidebarLinks.some((link) => {
            return (
              link.props('to') === NTHS_TEAM_LINK.to &&
              link.props('text') === NTHS_TEAM_LINK.text
            )
          })
          expect(isTargetLinkPresent).toEqual(true)
        }
      )
    })
  })
})
