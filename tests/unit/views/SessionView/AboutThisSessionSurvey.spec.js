import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import AboutThisSessionSurvey from '@/components/AboutThisSessionSurvey.vue'
import AnalyticsService from "@/services/AnalyticsService";
import { EVENTS } from '@/consts'

vi.mock('../../../../services/AnalyticsService')

describe('AboutThisSessionSurvey', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  window.Element.prototype.scrollIntoView = vi.fn() // jsdom does not support scroll functions
  const question1Selector = '[data-testid="question-1"]'
  const question2Selector = '[data-testid="question-2"]'
  const lowRatingButtonSelector = '[data-testid="low-rating-btn"]'
  const highRatingButtonSelector = '[data-testid="high-rating-btn"]'
  const submitButtonSelector = '[data-testid="submit-feedback-btn"]'
  const completedMessageSelector = '[data-testid="completed-message"]'
  const feedbackPromptSelector = '[data-testid="feedback-prompt"]'
  const commentsTextAreaSelector = '[data-testid="comments-textarea"]'
  const sessionId = '12345'

  const getWrapper = () => {
    return mount(AboutThisSessionSurvey, {
      global: {
        mocks: {
          $route: {
            params: { sessionId }
          }
        }
      }
    })
  }

  it('Should only render question 2 after question 1 response is submitted', async () => {
    const wrapper = getWrapper()
    // Initially, only question 1 is visible
    expect(wrapper.find(question1Selector).isVisible()).toBeTruthy()
    expect(wrapper.find(question2Selector).exists()).toBeFalsy()
    // Fill out question 1 ==> question 2 renders
    await wrapper.find(lowRatingButtonSelector).trigger('click')
    expect(wrapper.find(question1Selector).isVisible()).toBeTruthy()
    expect(wrapper.find(question2Selector).isVisible()).toBeTruthy()
  })

  it('Should display the completed state after all responses submitted', async () => {
    const wrapper = getWrapper()
    expect(wrapper.find(feedbackPromptSelector).isVisible()).toBeTruthy()

    await wrapper.find(lowRatingButtonSelector).trigger('click')
    await wrapper.find(submitButtonSelector).trigger('click')

    expect(wrapper.find(question1Selector).exists()).toBeFalsy()
    expect(wrapper.find(question2Selector).exists()).toBeFalsy()
    expect(wrapper.find(submitButtonSelector).exists()).toBeFalsy()
    expect(wrapper.find(feedbackPromptSelector).exists()).toBeFalsy()
    expect(wrapper.find(completedMessageSelector).isVisible()).toBeTruthy()
  })

  it('Should emit events with the response data', async () => {
    const wrapper = getWrapper()
    const captureEventSpy = vi.spyOn(AnalyticsService, 'captureEvent')
    expect(captureEventSpy).not.toHaveBeenCalled()

    await wrapper.find(lowRatingButtonSelector).trigger('click')
    expect(captureEventSpy).toHaveBeenCalledWith(EVENTS.SELECTED_ABOUT_THIS_SESSION_RATING, {
      sessionId,
      rating: -1
    })

    vi.resetAllMocks()
    await wrapper.find(highRatingButtonSelector).trigger('click')
    expect(captureEventSpy).toHaveBeenCalledWith(EVENTS.SELECTED_ABOUT_THIS_SESSION_RATING, {
      sessionId,
      rating: 1
    })

    vi.resetAllMocks()
    const feedback = 'This is a test feedback'
    await wrapper.find(commentsTextAreaSelector).setValue(feedback)
    expect(captureEventSpy).not.toHaveBeenCalled()
    await wrapper.find(submitButtonSelector).trigger('click')
    expect(captureEventSpy).toHaveBeenCalledWith(EVENTS.SUBMITTED_ABOUT_THIS_SESSION_COMMENTS, {
      sessionId,
      comments: feedback
    })
  })
})
