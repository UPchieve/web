import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
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
        ...storeOptions.modules,
        user: {
          ...storeOptions.modules.user,
          state: {
            session: {
              ...DEFAULT_SESSION,
            },
          },
        },
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            isAboutThisSessionSurveyActive: () =>
              overrides.featureFlags?.isAboutThisSessionSurveyActive ?? false,
          },
        },
      },
    })

    return mount(AboutSessionModal, {
      global: {
        plugins: [store],
        mocks: {
          $route: {
            params: { sessionId: '12345' },
            query: {},
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
            isAboutThisSessionSurveyActive: surveyEnabled,
          },
        })
        expect(
          wrapper.find('[data-testid="about-this-session-survey"]').exists()
        ).toEqual(surveyEnabled)
      }
    )
  })

  describe('About This Session student session count', () => {
    it('Should render "first" for the first session', () => {
      const wrapper = getWrapper({
        props: {
          totalStudentSessions: 1,
        },
      })
      expect(wrapper.find('[data-testid="total-sessions"]').text()).toContain(
        'first'
      )
    })

    it('Should render "second" for the second session', () => {
      const wrapper = getWrapper({
        props: {
          totalStudentSessions: 2,
        },
      })
      expect(wrapper.find('[data-testid="total-sessions"]').text()).toContain(
        'second'
      )
    })

    it('Should render "third" for the third session', () => {
      const wrapper = getWrapper({
        props: {
          totalStudentSessions: 3,
        },
      })
      expect(wrapper.find('[data-testid="total-sessions"]').text()).toContain(
        'third'
      )
    })

    it.each([
      [4, 'th'],
      [101, 'st'],
      [22, 'nd'],
      [73, 'rd'],
      [561, 'st'],
      [872, 'nd'],
      [1093, 'rd'],
      // Special cases when ending in 11-13.
      [11, 'th'],
      [12, 'th'],
      [13, 'th'],
      [111, 'th'],
      [112, 'th'],
      [113, 'th'],
      [211, 'th'],
      [212, 'th'],
      [213, 'th'],
    ])(
      'Should render the number with the appropriate suffix for the %s%s session',
      (sessionCount, suffix) => {
        const wrapper = getWrapper({
          props: {
            totalStudentSessions: sessionCount,
          },
        })
        expect(wrapper.find('[data-testid="total-sessions"]').text()).toContain(
          sessionCount + suffix
        )
      }
    )
  })
})
