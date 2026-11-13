import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { vi } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import FeedbackView from '@/views/FeedbackView.vue'
import { caresChoices, caresQuestion } from '../fixtures/surveys'

vi.mock('@/services/AnalyticsService', () => ({
  default: { captureEvent: () => {} },
}))

vi.mock('@/services/NetworkService', () => ({
  default: {
    getSession: () =>
      Promise.resolve({
        data: {
          session: {
            id: 'session-id',
            subTopic: 'algebraOne',
            volunteerId: 'coach-id',
            volunteer: { _id: 'coach-id', firstName: 'Coach' },
            student: { firstName: 'Student' },
          },
        },
      }),
    getPostsessionSurveyResponse: () => Promise.resolve({ data: [] }),
    getPostsessionSurvey: () =>
      Promise.resolve({
        data: {
          survey: { surveyId: 33, surveyTypeId: 2, survey: [caresQuestion] },
        },
      }),
    checkIsFavoriteVolunteer: () =>
      Promise.resolve({ data: { isFavorite: false } }),
    getRemainingFavoriteVolunteers: () =>
      Promise.resolve({ data: { remaining: 3 } }),
  },
}))

describe('FeedbackView', () => {
  enableAutoUnmount(afterEach)

  it('lets the student answer a 1 to 5 question grouped under its title', async () => {
    const store = createStore({
      modules: {
        user: {
          namespaced: true,
          state: { user: { id: 'student-id' } },
          getters: {
            userType: () => 'student',
            isVolunteer: () => false,
            isStudent: () => true,
          },
        },
        subjects: { namespaced: true, state: { subjects: {} } },
        featureFlags: {
          namespaced: true,
          getters: {
            volunteerFeedbackForStudentFlag: () => false,
            getStudentPostSessionSurveyNameVariant: () => undefined,
          },
        },
      },
    })
    mount(FeedbackView, {
      attachTo: document.body,
      global: {
        plugins: [store],
        mocks: { $route: { params: { sessionId: 'session-id' } } },
      },
    })
    await flushPromises()

    await userEvent.click(page.getByText('Somewhat'))

    await expect.element(caresChoices().nth(2)).toBeChecked()
    await expect
      .element(page.getByRole('button', { name: 'Submit' }))
      .toBeEnabled()
  })
})
