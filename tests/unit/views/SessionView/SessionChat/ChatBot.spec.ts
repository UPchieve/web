import { beforeEach, expect, it, vi, describe, afterEach } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import ChatBot from '@/views/SessionView/SessionChat/ChatBot.vue'
import NetworkService from '@/services/NetworkService'
import { nextTick } from 'vue'
import { getSessionEndDMsMessage } from '../../../../../src/utils/chatbot-utils'
import { dayjs } from '@/utils/time-utils'

vi.mock('../../../../../services/NetworkService')

describe('ChatBot', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    NetworkService.isSessionRecapEligible = vi.fn().mockResolvedValue({
      data: {
        isEligible: true,
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const getWrapper = (overrides = {}) => {
    const defaultProps = {
      isSessionRecapBot: false,
      isInRecap: false,
      currentSession: {},
      isDisplayingLanguagesSpoken: false,
    }
    const store = createStore({
      modules: {
        ...storeOptions.modules,
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            ...(overrides?.featureFlags?.getters ?? {}),
          },
        },
        user: {
          ...storeOptions.modules.user,
          state: {
            ...storeOptions.modules.user.state,
            ...(overrides?.user?.state ?? {}),
          },
          getters: {
            ...storeOptions.modules.user.getters,
            ...(overrides?.user?.getters ?? {}),
          },
          actions: {
            ...storeOptions.modules.user.actions,
            ...(overrides?.user?.actions ?? {}),
          },
        },
      },
    })
    return shallowMount(ChatBot, {
      global: {
        plugins: [store],
      },
      propsData: {
        ...defaultProps,
        ...(overrides?.props ?? {}),
      },
    })
  }
  describe('Direct Messages system message', () => {
    const currentSession = {
      id: 'session',
      student: { id: 'student' },
      volunteer: { id: 'volunteer' },
      isEnding: true,
      messages: [],
    }

    it('Shows the correct message to a volunteer in the recap view', async () => {
      const mockAddMessage = vi.fn()
      const userId = currentSession.volunteer.id
      const session = { ...currentSession, endedAt: new Date() }
      getWrapper({
        featureFlags: {
          getters: {
            isStudentsInitiateDmsEnabled: () => true,
          },
        },
        user: {
          state: {
            recapSession: { messages: [] },
            session,
            user: {
              id: userId,
            },
          },
          getters: {
            isStudent: () => false,
            isVolunteer: () => true,
          },
          actions: {
            addMessage: mockAddMessage,
          },
        },
        props: {
          currentSession: session,
          isInRecap: true,
          isSessionRecapEligible: true,
          isSessionRecapBot: false,
        },
      })
      vi.runAllTimers()
      await nextTick()
      await flushPromises()

      const expectedMessage = getSessionEndDMsMessage(false, true)
      expect(mockAddMessage).toHaveBeenCalledTimes(1)
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.anything(), // first arg is the store
        expect.objectContaining({
          contents: expectedMessage,
          createdAt: expect.anything(),
          user: null,
          hasHtml: true,
          sessionId: currentSession.id,
        })
      )
    })

    it('Shows the correct message to a student in the recap view', async () => {
      const mockAddMessage = vi.fn()
      const userId = currentSession.student.id
      const session = {
        ...currentSession,
        endedAt: new Date(),
      }
      getWrapper({
        featureFlags: {
          getters: {
            isStudentsInitiateDmsEnabled: () => true,
          },
        },
        user: {
          state: {
            recapSession: {
              messages: [
                {
                  createdAt: dayjs().add(1, 'hour').toDate(),
                },
              ],
            },
            session,
            user: {
              id: userId,
            },
          },
          getters: {
            isStudent: () => true,
            isVolunteer: () => false,
          },
          actions: {
            addMessage: mockAddMessage,
          },
        },
        props: {
          currentSession: session,
          isInRecap: true,
          isSessionRecapEligible: true,
          isSessionRecapBot: false,
        },
      })
      vi.runAllTimers()
      await nextTick()
      await flushPromises()

      const expectedMessage = getSessionEndDMsMessage(true, true)
      expect(mockAddMessage).toHaveBeenCalledTimes(1)
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.anything(), // first arg is the store
        expect.objectContaining({
          contents: expectedMessage,
          createdAt: expect.anything(),
          user: null,
          hasHtml: true,
          sessionId: currentSession.id,
        })
      )
    })

    it('Does not launch the session ended chatbot messages if DMs have already been sent', async () => {
      const mockAddMessage = vi.fn()
      const userId = currentSession.student.id
      const sessionEndedAt = dayjs().subtract(1, 'hour').toDate()
      const dmMessageSentAt = dayjs().add(1, 'hour').toDate()
      const session = {
        ...currentSession,
        endedAt: sessionEndedAt,
        messages: [
          {
            createdAt: dmMessageSentAt,
            user: userId,
          },
        ],
      }
      getWrapper({
        featureFlags: {
          getters: {
            isStudentsInitiateDmsEnabled: () => true,
          },
        },
        user: {
          state: {
            recapSession: {
              messages: [
                {
                  createdAt: dayjs().add(1, 'hour').toDate(),
                },
              ],
            },
            session,
            user: {
              id: userId,
            },
          },
          getters: {
            isStudent: () => true,
            isVolunteer: () => false,
          },
          actions: {
            addMessage: mockAddMessage,
          },
        },
        props: {
          currentSession: session,
          isInRecap: true,
          isSessionRecapEligible: true,
          isSessionRecapBot: false,
        },
      })
      vi.runAllTimers()
      await nextTick()
      await flushPromises()

      expect(mockAddMessage).not.toHaveBeenCalled()
    })
  })
})
