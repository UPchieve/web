import { test, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SessionChat from '@/views/SessionView/SessionChat/index.vue'
import Vuex from 'vuex'
import ModerationService from '@/services/ModerationService'
import flushPromises from 'flush-promises'

vi.mock('../../../../../services/ModerationService')
describe('SessionChat', () => {
  const getWrapper = (overrides = {}) => {
    const store = new Vuex.Store({
      modules: {
        user: {
          state: {
            user: {
              isVolunteer: false,
              ...overrides?.user?.state ?? {}
            },
            unreadChatMessageIndices: [],
            chatScrolledToMessageIndex: null,
          },
          getters: {
            isSessionWaitingForVolunteer: () => true,
            numberOfUnreadChatMessages: () => 0,
          },
        },
        app: {
          state: {
            isWebPageHidden: false,
          },
        },
        featureFlags: {
          getters: {
            isSessionRecapDmsActive: () => true,
          },
        },
        socket: {
          messageData: {},
        },
      },
    })
    return shallowMount(SessionChat, {
      // localVue,
      global: {
        plugins: [store],
      },
      // store,
      propsData: {
        currentSession,
      },
    })
  }

  const sendMessage = async (wrapper) => {
    const textArea = wrapper.get('[data-testid="chat-textarea"]')
    const message = 'a message'

    await textArea.setValue(message)
    expect(textArea.element.value).toEqual(message)

    await textArea.trigger('keyup', {
      key: 'Enter', // Send message
    })

    return message
  }

  const currentSession = {
    messages: [],
    id: '123',
  }
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test.each([{ failures: {} }, { failures: { profanity: ['butt'] } }])(
    'It clears the textarea only when the message is clean and can be sent (isClean=%s)',
    async (isClean) => {
      ModerationService.checkIfMessageIsClean = vi
        .fn()
        .mockResolvedValue(isClean)
      const wrapper = getWrapper()
      const textArea = wrapper.get('[data-testid="chat-textarea"]')
      const message = await sendMessage(wrapper)

      expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledWith({
        message,
        sessionId: currentSession.id,
      })
      await flushPromises()
      const hasFailures = Boolean(isClean.failures.profanity)
      expect(textArea.element.value).toEqual(hasFailures ? message : '')
    }
  )

  test.each([
    {
      hateful_language: ['1', '2'],
      profanity: ['5hit']
    },
    {
      hateful_language: ['1']
    },
    { profanity: ['5hit'] } ,
    {
      hateful_language: ['1', '2'],
      profanity: undefined
    },
    {
      hateful_language: ['1', '2'],
      profanity: []
    },
  ])('It renders the moderation failure reasons (failures=%s)', async (moderationFailures) => {
    ModerationService.checkIfMessageIsClean = vi.fn().mockResolvedValue({
      failures: moderationFailures
    })
    const wrapper = getWrapper({
      user: {
        state: {
          isVolunteer: true,
        }
      }
    })
    const message = await sendMessage(wrapper)
    expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledWith({
      message,
      sessionId: currentSession.id,
    })
    expect(wrapper.find('[data-testid="moderation-body"]').isVisible()).toBeTruthy()
    // Expect each reason to be rendered, as well as one additional div per reason
    // that contains the offending substrings
    const expectedDataTestIds = Object.keys(moderationFailures)
    Object.keys(moderationFailures).forEach((reason) => {
      expectedDataTestIds.push(`${reason}-instances`)
    })
    expect(expectedDataTestIds.length).toEqual(Object.keys(moderationFailures).length * 2)
    expectedDataTestIds.forEach((testId) => {
      expect(wrapper.find(`[data-testid="${testId}"]`).isVisible()).toBeTruthy()
    })
  })

  it('Does not render profanity for students', async () => {
    ModerationService.checkIfMessageIsClean = vi.fn().mockResolvedValue({
      failures: {
        profanity: ['5hit'],
        hateful_language: ['1'],
      }
    })
    const wrapper = getWrapper({
      user: {
        state: {
          isVolunteer: false,
        }
      }
    })
    const message = await sendMessage(wrapper)

    expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledWith({
      message,
      sessionId: currentSession.id,
    })
    expect(wrapper.find('[data-testid="moderation-body"]').isVisible()).toBeTruthy()
    expect(wrapper.find('[data-testid="hateful_language"]').isVisible()).toBeTruthy()
    expect(wrapper.find('[data-testid="hateful_language-instances"]').isVisible()).toBeTruthy()
    expect(wrapper.find('[data-testid="profanity"]').exists()).toBeFalsy()
    expect(wrapper.find('[data-testid="profanity-instances"]').exists()).toBeFalsy()
  })
})
