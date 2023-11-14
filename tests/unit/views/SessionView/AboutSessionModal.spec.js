import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import userModule from '@/store/modules/user'
import AboutSessionModal from '@/views/SessionView/AboutSessionModal.vue'
describe('AboutSessionModal', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  let DEFAULT_SESSION, DEFAULT_PROPS

  beforeEach(() => {
    jest.resetAllMocks()

    DEFAULT_SESSION = {
      student: {
        firstname: 'Malzie',
      },
    }

    DEFAULT_PROPS = {
      closeModal: jest.fn(),
      responses: [],
      totalStudentSessions: 5,
    }
  })

  /**
   * @returns {Wrapper<Vue>}
   * @param overrides - May have property 'props'
   */
  const getWrapper = (overrides = {}) => {
    const store = new Vuex.Store({
      modules: {
        user: {
          ...userModule,
          state: {
            session: {
              ...DEFAULT_SESSION,
            },
          },
        },
      },
    })

    return shallowMount(AboutSessionModal, {
      localVue,
      store,
      propsData: {
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
      score => {
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
})
