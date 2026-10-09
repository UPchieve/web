import { beforeEach, describe, expect, test, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'

import router from '@/router'
import userModule from '@/store/modules/user'
import subjectsModule from '@/store/modules/subjects'
import NetworkService from '@/services/NetworkService'
import { dayjs } from '@/utils/time-utils'
import TrainingView from '@/views/TrainingView.vue'

// The real one reads the app's global store, which these tests leave empty
vi.mock('@/utils/get-training-progress', async (importOriginal) => ({
  ...(await importOriginal()),
  isTrainingComplete: () => false,
}))

vi.mock('exponential-backoff', () => ({ backOff: (request) => request() }))

const TRAINING = {
  subjectTypes: [{ key: 'math', displayName: 'Math' }],
  math: {
    certifications: [
      { key: 'algebraOne', displayName: 'Algebra 1', active: true },
    ],
    additionalSubjects: [],
    computedSubjects: [],
  },
}

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
      // Production Vue logs a render error and renders nothing in its place
      config: { errorHandler: () => {} },
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
      stubs: {
        TrainingDropDown: true,
        SubjectCertsDropDown: true,
        AdditionalSubjectsDropDown: true,
      },
    },
  })
}

describe('TrainingView subjects', () => {
  beforeEach(() => {
    NetworkService.getTrainingCourse = vi.fn().mockResolvedValue({ data: {} })
    NetworkService.getVolunteerFirstSessionDate = vi
      .fn()
      .mockResolvedValue({ data: { firstSessionDate: null } })
  })

  test('shows the loader until the training subjects arrive, then the selected subject', async () => {
    let resolveTrainingSubjects
    NetworkService.getTrainingSubjects = vi.fn(
      () => new Promise((resolve) => (resolveTrainingSubjects = resolve))
    )

    const wrapper = getWrapper()
    await flushPromises()
    expect(wrapper.find('.loader--center').exists()).toBe(true)

    resolveTrainingSubjects({ data: { training: TRAINING } })
    await flushPromises()

    expect(wrapper.find('.loader--center').exists()).toBe(false)
    expect(wrapper.find('.is-selected').text()).toBe('Math')
    expect(
      wrapper.find('[data-testid="subject-certifications"]').exists()
    ).toBe(true)
  })

  test('shows the loading error when the training subjects fail to load', async () => {
    NetworkService.getTrainingSubjects = vi
      .fn()
      .mockRejectedValue(new Error('Request failed'))

    const wrapper = getWrapper()
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain(
      'We had trouble loading the training material'
    )
  })
})

describe('TrainingView certificate', () => {
  beforeEach(() => {
    NetworkService.getTrainingSubjects = vi
      .fn()
      .mockResolvedValue({ data: { training: TRAINING } })

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
