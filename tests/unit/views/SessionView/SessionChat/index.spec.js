import { test, vi } from 'vitest'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import SessionChat from '@/views/SessionView/SessionChat/index.vue'
import Vuex from 'vuex'
import ModerationService from '@/services/ModerationService'
import VueSocketIO from 'vue-socket.io'
import flushPromises from 'flush-promises'

vi.mock('../../../../../services/ModerationService')
describe('SessionChat', () => {
  const mockSocket = new VueSocketIO({
    connection: 'socketserver.test',
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: vi.fn(),
  })
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(mockSocket)

  const getWrapper = () => {
    const store = new Vuex.Store({
      modules: {
        user: {
          state: {
            user: {},
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
      },
    })
    return shallowMount(SessionChat, {
      localVue,
      store,
      propsData: {
        currentSession,
      },
    })
  }

  const currentSession = {
    messages: [],
    id: '123',
  }
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test.each([true, false])(
    'It clears the textarea only when the message is clean and can be sent (isClean=%s)',
    async (isClean) => {
      ModerationService.checkIfMessageIsClean = vi
        .fn()
        .mockResolvedValue(isClean)
      const wrapper = getWrapper()
      const textArea = wrapper.get('[data-testid="chat-textarea"]')
      const message = 'a message'

      textArea.setValue(message)
      expect(textArea.element.value).toEqual(message)

      textArea.trigger('keyup', {
        key: 'Enter', // Send message
      })
      expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledOnce()
      expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledWith({
        message,
        sessionId: currentSession.id,
      })
      await flushPromises()
      expect(textArea.element.value).toEqual(isClean ? '' : message)
    }
  )
})
