import {
  enableAutoUnmount,
  flushPromises,
  mount,
  RouterLinkStub,
} from '@vue/test-utils'
import { createStore } from 'vuex'
import { vi } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import FeedbackView from '@/views/FeedbackView.vue'
import NetworkService from '@/services/NetworkService'
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
    getPostsessionSurveyResponse: vi.fn(() => Promise.resolve({ data: [] })),
    getPostsessionSurvey: vi.fn(() =>
      Promise.resolve({
        data: {
          survey: { surveyId: 33, surveyTypeId: 2, survey: [caresQuestion] },
        },
      })
    ),
    checkIsFavoriteVolunteer: () =>
      Promise.resolve({ data: { isFavorite: false } }),
    getRemainingFavoriteVolunteers: () =>
      Promise.resolve({ data: { remaining: 3 } }),
  },
}))

describe('FeedbackView', () => {
  enableAutoUnmount(afterEach)
  const router = { replace: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountFeedback(userType = 'student') {
    const store = createStore({
      modules: {
        user: {
          namespaced: true,
          state: { user: { id: 'student-id' } },
          getters: {
            userType: () => userType,
            isVolunteer: () => userType === 'volunteer',
            isStudent: () => userType === 'student',
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
    return mount(FeedbackView, {
      attachTo: document.body,
      global: {
        plugins: [store],
        mocks: {
          $route: { params: { sessionId: 'session-id' } },
          $router: router,
        },
        stubs: { RouterLink: RouterLinkStub },
      },
    })
  }

  it('lets the student answer a 1 to 5 question grouped under its title', async () => {
    mountFeedback()
    await flushPromises()

    await userEvent.click(page.getByText('Somewhat'))

    await expect.element(caresChoices().nth(2)).toBeChecked()
    await expect
      .element(page.getByRole('button', { name: 'Submit' }))
      .toBeEnabled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  describe.each(['student', 'volunteer'])('as a %s', (userType) => {
    const noSurveyCases = [
      { description: 'no survey', response: { data: {} } },
      {
        description: 'a survey with no questions',
        response: {
          data: { survey: { surveyId: 33, surveyTypeId: 2, survey: [] } },
        },
      },
    ]
    it.each(noSurveyCases)(
      'redirects to the dashboard when there is $description',
      async ({ response }) => {
        NetworkService.getPostsessionSurvey.mockResolvedValueOnce(response)
        mountFeedback(userType)
        await flushPromises()

        expect(router.replace).toHaveBeenCalledExactlyOnceWith('/dashboard')
      }
    )

    it('shows the thank-you message without fetching the survey when feedback was already submitted', async () => {
      NetworkService.getPostsessionSurveyResponse.mockResolvedValueOnce({
        data: [{}],
      })
      mountFeedback(userType)
      await flushPromises()

      await expect
        .element(page.getByText('Thank you for your feedback!'))
        .toBeVisible()
      expect(router.replace).not.toHaveBeenCalled()
      expect(NetworkService.getPostsessionSurvey).not.toHaveBeenCalled()
    })
  })
})
