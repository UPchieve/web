import SidebarLink from '@/components/App/AppSidebar/SidebarLink.vue'
import SidebarLinks from '@/components/App/AppSidebar/SidebarLinks.vue'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'
import featureFlagsModule from '@/store/modules/feature-flags'

// General links
const CONTACT_LINK = { to: '/contact', text: 'Contact us' }
const DASHBOARD_LINK = { to: '/dashboard', text: 'Dashboard' }
const PROFILE_LINK = { to: '/profile', text: 'Profile' }

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
const MY_CLASSES_LINK_TEACHERS = {
  to: '/dashboard',
  text: 'My Classes',
}

// Volunteer links
const CALENDAR_LINK = { to: '/calendar', text: 'Schedule' }
const TRAINING_LINK = {
  to: '/training',
  text: 'Training',
}
const COMMUNITY_LINK = {
  // This link changes. Just match the consistent portion.
  to: 'https://join.slack.com/t/upchieveaccommunity/shared_invite/',
  text: 'Community',
}
// Admin links
const ADMIN_LINK = { to: '/admin', text: 'Admin' }

// Links organized by route & user type. Array indices of the links are important.
const links = {
  default: {
    loggedOut: [],
    student: [
      DASHBOARD_LINK,
      SESSION_HISTORY_LINK,
      FAVORITE_COACHES_LINK,
      PROFILE_LINK,
      CONTACT_LINK,
    ],
    studentWithClasses: [
      DASHBOARD_LINK,
      SESSION_HISTORY_LINK,
      FAVORITE_COACHES_LINK,
      MY_CLASSES_LINK,
      PROFILE_LINK,
      CONTACT_LINK,
    ],
    volunteer: [
      DASHBOARD_LINK,
      TRAINING_LINK,
      CALENDAR_LINK,
      SESSION_HISTORY_LINK,
      PROFILE_LINK,
      CONTACT_LINK,
      COMMUNITY_LINK,
    ],
    admin: [
      DASHBOARD_LINK,
      TRAINING_LINK,
      CALENDAR_LINK,
      SESSION_HISTORY_LINK,
      ADMIN_LINK,
      PROFILE_LINK,
      CONTACT_LINK,
      COMMUNITY_LINK,
    ],
    teacher: [MY_CLASSES_LINK_TEACHERS, PROFILE_LINK, CONTACT_LINK],
  },
  onboarding: {
    student: [],
    volunteer: [],
  },
}

const getWrapper = (options = {}) => {
  options = {
    authenticated: false,
    userType: 'student',
    isVolunteer: false,
    isStudent: true,
    isTeacher: false,
    isAdmin: false,
    mobileMode: false,
    path: '/',
    isAssignmentsEnabled: false,
    numberOfStudentClasses: 0,
    ...options,
  }

  const store = createStore({
    modules: {
      user: {
        ...userModule,
        getters: {
          isVolunteer: () => options.isVolunteer,
          isStudent: () => options.isStudent,
          isTeacher: () => options.isTeacher,
        },
      },
      featureFlags: {
        ...featureFlagsModule,
        getters: {
          isAssignmentsEnabled: () => options.isAssignmentsEnabled,
        },
      },
    },
  })

  return shallowMount(SidebarLinks, {
    global: {
      plugins: [store],
      mocks: { $route: { path: options.path } },
    },
    props: {
      authenticated: options.authenticated,
      userType: options.userType,
      isAdmin: options.isAdmin,
      mobileMode: options.mobileMode,
      numberOfStudentClasses: options.numberOfStudentClasses,
    },
  })
}

describe('SidebarLinks', () => {
  it('layout', async () => {
    const wrapper = getWrapper({ authenticated: true })
    expect(wrapper.classes('SidebarLinks')).toBe(true)
    expect(wrapper.findAllComponents(SidebarLink).length).toBeGreaterThan(0)

    const about = wrapper.find('.SidebarLinks-about')
    expect(about.exists()).toBe(true)
    expect(about.text()).toBe('About UPchieve')

    await wrapper.setProps({ mobileMode: true })
    expect(wrapper.find('.SidebarLinks-about').exists()).toBe(false)
  })

  describe('link tests', () => {
    const testLinks = (wrapper, expectedLinks) => {
      const sidebarLinks = wrapper.findAllComponents(SidebarLink)
      expect(sidebarLinks.length).toBe(expectedLinks.length)
      expectedLinks.forEach((link, i) => {
        const sidebarLink = sidebarLinks.at(i)
        expect(sidebarLink.props('to')).toContain(link.to)
        // expect(sidebarLink.contains(link.icon)).toBe(true);
        expect(sidebarLink.props('text')).toBe(link.text)
      })
    }

    describe('mobileMode: true', () => {
      it('renders default links when not logged in', () => {
        const wrapper = getWrapper({ mobileMode: true })
        testLinks(wrapper, links.default.loggedOut)
      })

      it('renders default links for student', () => {
        const wrapper = getWrapper({ mobileMode: true, authenticated: true })
        testLinks(wrapper, links.default.student)
      })

      it('renders onboarding links for student', () => {
        const wrapper = getWrapper({ mobileMode: true, path: '/onboarding' })
        testLinks(wrapper, links.onboarding.student)
      })

      it('renders default links for volunteer', () => {
        const wrapper = getWrapper({
          mobileMode: true,
          authenticated: true,
          isVolunteer: true,
          isStudent: false,
        })
        testLinks(wrapper, links.default.volunteer)
      })

      it('renders onboarding links for volunteer', () => {
        const wrapper = getWrapper({
          mobileMode: true,
          isVolunteer: true,
          isStudent: false,
          path: '/onboarding',
        })
        testLinks(wrapper, links.onboarding.volunteer)
      })

      it('renders default links for admin', () => {
        const wrapper = getWrapper({
          mobileMode: true,
          isAdmin: true,
          authenticated: true,
          isVolunteer: true,
          isStudent: false,
        })
        testLinks(wrapper, links.default.admin)
      })

      it('renders "My Classes" link if the student has classes and feature flag is enabled', () => {
        const wrapper = getWrapper({
          authenticated: true,
          mobileMode: true,
          isStudent: true,
          numberOfStudentClasses: 1,
          isAssignmentsEnabled: true,
        })
        testLinks(wrapper, links.default.studentWithClasses)
      })

      it('does not render "My Classes" link if the student does not have any classes and the feature flag is enabled', () => {
        const wrapper = getWrapper({
          authenticated: true,
          mobileMode: true,
          isStudent: true,
          numberOfStudentClasses: 0,
          isAssignmentsEnabled: true,
        })
        testLinks(wrapper, links.default.student)
      })

      it('does not render "My Classes" link if the student have classes and the feature flag is disabled', () => {
        const wrapper = getWrapper({
          authenticated: true,
          mobileMode: true,
          isStudent: true,
          numberOfStudentClasses: 2,
          isAssignmentsEnabled: false,
        })
        testLinks(wrapper, links.default.student)
      })

      it('renders default links for teacher', () => {
        const wrapper = getWrapper({
          authenticated: true,
          isStudent: false,
          mobileMode: true,
          isTeacher: true,
        })
        testLinks(wrapper, links.default.teacher)
      })
    })

    describe('mobileMode: false', () => {
      it('renders default links when not logged in', () => {
        const wrapper = getWrapper({ mobileMode: false })
        testLinks(wrapper, links.default.loggedOut)
      })

      it('renders default links for student', () => {
        const wrapper = getWrapper({ mobileMode: false, authenticated: true })
        testLinks(wrapper, links.default.student)
      })

      it('renders onboarding links for student', () => {
        const wrapper = getWrapper({ mobileMode: false, path: '/onboarding' })
        testLinks(wrapper, links.onboarding.student)
      })

      it('renders default links for volunteer', () => {
        const wrapper = getWrapper({
          mobileMode: false,
          authenticated: true,
          isVolunteer: true,
          isStudent: false,
        })
        testLinks(wrapper, links.default.volunteer)
      })

      it('renders onboarding links for volunteer', () => {
        const wrapper = getWrapper({
          mobileMode: false,
          isVolunteer: true,
          isStudent: false,
          path: '/onboarding',
        })
        testLinks(wrapper, links.onboarding.volunteer)
      })

      it('renders default links for admin', () => {
        const wrapper = getWrapper({
          mobileMode: false,
          isAdmin: true,
          isVolunteer: true,
          isStudent: false,
          authenticated: true,
        })
        testLinks(wrapper, links.default.admin)
      })

      it('renders "My Classes" link if the student has classes and feature flag is enabled', () => {
        const wrapper = getWrapper({
          authenticated: true,
          isStudent: true,
          numberOfStudentClasses: 1,
          isAssignmentsEnabled: true,
        })
        testLinks(wrapper, links.default.studentWithClasses)
      })

      it('does not render "My Classes" link if the student does not have any classes and the feature flag is enabled', () => {
        const wrapper = getWrapper({
          authenticated: true,
          isStudent: true,
          numberOfStudentClasses: 0,
          isAssignmentsEnabled: true,
        })
        testLinks(wrapper, links.default.student)
      })

      it('does not render "My Classes" link if the student have classes and the feature flag is disabled', () => {
        const wrapper = getWrapper({
          authenticated: true,
          isStudent: true,
          numberOfStudentClasses: 2,
          isAssignmentsEnabled: false,
        })
        testLinks(wrapper, links.default.student)
      })
    })
  })
})
