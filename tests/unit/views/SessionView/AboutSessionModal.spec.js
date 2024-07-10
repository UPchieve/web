import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'
import featureFlagsModule from '@/store/modules/feature-flags'
import AboutSessionModal from '@/views/SessionView/AboutSessionModal.vue'
import { vi } from 'vitest'

describe('AboutSessionModal', () => {
  const DEFAULT_PROPS = {
    closeModal: vi.fn(),
    responses: [],
    totalStudentSessions: 5,
  }
  const DEFAULT_SESSION = {
    student: {
      firstname: 'Malzie',
    },
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  /**
   * @returns {Wrapper<Vue>}
   * @param overrides - May have property 'props'
   */
  const getWrapper = (overrides = {}) => {
    const store = createStore({
      modules: {
        user: {
          ...userModule,
          state: {
            session: {
              ...DEFAULT_SESSION,
            },
          },
        },
        featureFlags: {
          ...featureFlagsModule,
          getters: {
            isAboutThisSessionSurveyActive: () =>
              overrides.featureFlags?.isAboutThisSessionSurveyActive ?? false,
          }
        }
      },
    })

    return mount(AboutSessionModal, {
      global: {
        plugins: [store],
        mocks: {
          $route: {
            params: { sessionId: '12345' },
          },
        },
      },
      props: {
        ...DEFAULT_PROPS,
        ...(overrides.props ?? {}),
      },
    })
  }

  describe('"UPchieve\'s tip" callout', () => {
    it('Should not render if the student scored above 2 in all the "How do they feel" questions', () => {
      const responses = [
        {
          displayLabel: 'How they feel about <subject>',
          response: 'Neutral',
          score: 3,
        },
        {
          displayLabel: 'Some other question',
          response: 'Neutral',
          score: 3,
        },
      ]
      const wrapper = getWrapper({
        props: {
          responses,
        },
      })
      expect(wrapper.find('[data-testid="upchieves-tip"]').exists()).toBeFalsy()
    })

    it('Should not render if the student has no responses for "How do they feel"-format questions', () => {
      const responses = [
        {
          displayLabel: 'Some question',
          response: 'Nervous',
          score: 2,
        },
      ]
      const wrapper = getWrapper({
        props: {
          responses,
        },
      })
      expect(wrapper.find('[data-testid="upchieves-tip"]').exists()).toBeFalsy()
    })

    it.each([1, 2])(
      'Should render if the student scored %s in any of the "How do they feel" questions',
      (score) => {
        const responses = [
          {
            displayLabel: 'How they feel about <subject>',
            response: 'Neutral',
            score,
          },
          {
            displayLabel: 'Some other question',
            response: 'Neutral',
            score: 3,
          },
        ]
        const wrapper = getWrapper({
          props: {
            responses,
          },
        })
        expect(
          wrapper.find('[data-testid="upchieves-tip"]').exists()
        ).toBeTruthy()
      }
    )

    it('Should not render if the student has had fewer than 3 sessions', () => {
      const responses = [
        {
          displayLabel: 'How they feel about <subject>',
          response: 'Neutral',
          score: 1,
        },
      ]
      const wrapper = getWrapper({
        props: {
          responses,
          totalStudentSessions: 2,
        },
      })
      expect(wrapper.find('[data-testid="upchieves-tip"]').exists()).toBeFalsy()
    })
  })

  describe('About This Session survey', () => {
    it.each([false, true])(
      'Should only render the survey if the FF is on',
      (surveyEnabled) => {
        const wrapper = getWrapper({
          featureFlags: {
            isAboutThisSessionSurveyActive: surveyEnabled
          }
        })
        expect(wrapper.find('[data-testid="about-this-session-survey"]').exists()).toEqual(surveyEnabled)
    })
  })
})
