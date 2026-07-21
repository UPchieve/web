import { beforeEach, describe, expect, test, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'

import router from '@/router'
import userModule from '@/store/modules/user'
import subjectsModule from '@/store/modules/subjects'
import NetworkService from '@/services/NetworkService'
import { dayjs } from '@/utils/time-utils'
import TrainingView from '@/views/TrainingView.vue'

const CERTIFIED_VOLUNTEER = {
  userType: 'volunteer',
  firstName: 'Ryland',
  lastName: 'Grace',
  hasCompletedVolunteerTraining: true,
  certifications: {
    algebraOne: { passed: true },
  },
}

function getWrapper(user = CERTIFIED_VOLUNTEER) {
  return mount(TrainingView, {
    global: {
      plugins: [
        router,
        createStore({
          modules: {
            user: {
              ...userModule,
              state: {
                ...userModule.state,
                user: { ...user },
              },
            },
            subjects: {
              ...subjectsModule,
              state: { ...subjectsModule.state },
            },
          },
        }),
      ],
    },
  })
}

describe('TrainingView certificate', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    NetworkService.getTrainingSubjects = vi
      .fn()
      .mockResolvedValue({ data: { training: {} } })

    NetworkService.getTrainingCourse = vi.fn().mockResolvedValue({ data: {} })
  })

  test('does not show the download button when there is no first session date', async () => {
    NetworkService.getVolunteerFirstSessionDate = vi
      .fn()
      .mockResolvedValue({ data: { firstSessionDate: null } })

    const wrapper = getWrapper()
    await flushPromises()

    expect(
      wrapper.find('[data-testid="download-certificate-button"]').exists()
    ).toBe(false)
    expect(wrapper.find('[data-testid="certificate-enabled"]').exists()).toBe(
      false
    )
  })

  test('does show the download button when there is a first session date', async () => {
    NetworkService.getVolunteerFirstSessionDate = vi
      .fn()
      .mockResolvedValue({ data: { firstSessionDate: dayjs().toDate() } })

    const wrapper = getWrapper()
    await flushPromises()

    expect(
      wrapper.find('[data-testid="download-certificate-button"]').exists()
    ).toBe(true)
    expect(wrapper.find('[data-testid="certificate-enabled"]').exists()).toBe(
      true
    )
  })

  test('puts the volunteer name and first session date on the certificate', async () => {
    const firstSessionDate = '2026-01-21T10:30:00.000Z'
    NetworkService.getVolunteerFirstSessionDate = vi
      .fn()
      .mockResolvedValue({ data: { firstSessionDate } })

    const wrapper = getWrapper()
    await flushPromises()

    expect(wrapper.vm.volunteerFullName).toBe(
      `${CERTIFIED_VOLUNTEER.firstName} ${CERTIFIED_VOLUNTEER.lastName}`
    )
    expect(wrapper.vm.effectiveDate).toBe(
      dayjs(firstSessionDate).format('MM/DD/YYYY')
    )
  })
})
