import Vuex from 'vuex'
import { vi } from 'vitest'
import { createLocalVue, mount } from '@vue/test-utils'
import { storeOptions } from '@/store'
import { merge } from 'lodash-es'
import ListSessions from '@/views/DashboardView/VolunteerDashboard/ListSessions.vue'
import VueRouter from 'vue-router'
import router from '@/router'
import moment from 'moment'

describe('Dashboard with Muted Subjects', () => {

  const localVue = createLocalVue()
  localVue.use(VueRouter)
  localVue.use(Vuex)

  beforeEach(() => {
    vi.resetAllMocks()
  })

  const getWrapper = () => {
    const store = new Vuex.Store(
      merge({}, storeOptions, {
        modules: {
          featureFlags: {
            getters: {
              isPaidTutorsPilotRunning: () => false,
              isFilterActiveSubjectsActive: () => true,
              isMutedSubjectAlertsActive: () => true,
            },
          },
          user: {
            state: {
              user: {
                isVolunteer: true,
                subjects: ['algebraOne', 'algebraTwo', 'biology'],
                activeSubjects: ['algebraOne', 'algebraTwo', 'biology'],
                mutedSubjectAlerts: ['algebraOne'],
              },
            },
          },
          subjects: {
            state: {
              subjects: ['algebraOne', 'algebraTwo', 'biology'],
            },
          },
        },
      })
    )

    // Mock the current time
    const currentTime = moment()
    const sessionOneTime = currentTime.clone().add(5, 'minutes').toISOString()
    const sessionTwoTime = currentTime.clone().add(10, 'minutes').toISOString()

    store.dispatch('volunteer/handleIncomingSessions', [
      {
        createdAt: sessionOneTime,
        id: 'session-1',
        student: {
          firstname: 'Student1',
          isTestUser: false,
        },
        studentFirstName: 'Student1',
        subTopic: 'algebraOne',
        subjectDisplayName: 'Algebra 1',
        type: 'math',
      },
      {
        createdAt: sessionTwoTime,
        id: 'session-2',
        student: {
          firstname: 'Student2',
          isTestUser: false,
        },
        studentFirstName: 'Student2',
        subTopic: 'algebraTwo',
        subjectDisplayName: 'Algebra 2',
        type: 'math',
      },
    ])

    return mount(ListSessions, {
      localVue,
      router,
      store,
    })
  }

  it('Should only show unmuted subject sessions', () => {
    const wrapper = getWrapper()
    const sessionRowMuted = wrapper.find('[data-testid="session-row-Student1"]')
    const sessionRowUnmuted = wrapper.find('[data-testid="session-row-Student2"]')
    
    expect(sessionRowUnmuted.exists()).toBe(true)
    expect(sessionRowMuted.exists()).toBe(false)

  })
})