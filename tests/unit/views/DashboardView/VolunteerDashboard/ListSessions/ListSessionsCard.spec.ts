import { storeOptions } from '@/store'
import router from '@/router'
import { createStore } from 'vuex'
import { mount } from '@vue/test-utils'
import ListSessionsCard from '@/views/DashboardView/VolunteerDashboard/ListSessions/ListSessionsCard.vue'
import { describe, expect, it } from 'vitest'
import { merge } from 'lodash-es'

type Overrides = {
  user?: {
    getters?: Record<string, () => unknown>
  }
}

const getWrapper = (overrides: Overrides = {}) => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        user: {
          getters: {
            isSessionAlive: () => false,
            ...(overrides.user?.getters ?? {}),
          },
        },
        volunteer: {
          getters: {
            isReadyToTutor: () => true,
            ...(overrides.volunteer?.getters ?? {}),
          },
        },
      },
    })
  )
  return mount(ListSessionsCard, {
    global: {
      plugins: [router, store],
      stubs: {
        QueueButton: true,
        ListSessions: true,
        Menu: true,
        WebNotificationsButton: true,
      },
    },
    props: {
      notificationsCardWasDismissed: false,
    },
  })
}

describe('ListSessionsCard', () => {
  it('Does not render the QueueButton when the volunteer is in a session', () => {
    const wrapper = getWrapper({
      user: { getters: { isSessionAlive: () => true } },
    })
    expect(wrapper.find('[data-testid="queue-button"]').exists()).toBe(false)
  })

  it('Does not render the QueueButton when the volunteer is not ready to coach', () => {
    const wrapper = getWrapper({
      user: { getters: { isSessionAlive: () => false } },
      volunteer: { getters: { isReadyToTutor: () => false } },
    })
    expect(wrapper.find('[data-testid="queue-button"]').exists()).toBe(false)
  })
})
