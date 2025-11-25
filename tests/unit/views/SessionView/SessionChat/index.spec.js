import { test, vi, describe, expect } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'
import SessionChat from '@/views/SessionView/SessionChat/index.vue'
import { storeOptions } from '@/store'
import ModerationService from '@/services/ModerationService'

vi.mock('../../../../../services/ModerationService')
describe('SessionChat', () => {
  const currentSession = {
    messages: [],
    id: '123',
  }
  function getWrapper(overrides = {}) {
    const store = createStore({
      modules: {
        ...storeOptions.modules,
        user: {
          ...storeOptions.modules.user,
          state: {
            user: {
              ...(overrides?.user?.state ?? {}),
            },
            unreadChatMessageIndices: [],
            chatScrolledToMessageIndex: null,
          },
          getters: {
            ...storeOptions.modules.user.getters,
            isVolunteer: () => overrides?.user?.isVolunteer,
            isStudent: () => overrides?.user?.isStudent,
            isSessionWaitingForVolunteer: () => true,
            numberOfUnreadChatMessages: () => 0,
          },
        },
        app: {
          ...storeOptions.modules.app,
          state: {
            isWebPageHidden: false,
          },
        },
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            isPendingMessagesEnabled: () =>
              overrides.isPendingMessagesEnabled ?? false,
          },
        },
        socket: {
          messageData: {},
        },
        liveMedia: {
          namespaced: true,
          modules: {
            audio: {
              state: {},
            },
          },
        },
      },
    })
    return shallowMount(SessionChat, {
      global: {
        plugins: [store],
      },
      propsData: {
        isSessionAlive: true,
        isSocketConnected: true,
        shouldHideChatSection: false,
        setHasSeenNewMessage: true,
        currentSession: overrides.currentSession ?? currentSession,
        isSocketSessionRoomConnected:
          overrides.isSocketSessionRoomConnected ?? true,
      },
    })
  }

  async function sendMessage(wrapper) {
    const textArea = wrapper.get('[data-testid="chat-textarea"]')
    const message = 'a message'

    await textArea.setValue(message)
    expect(textArea.element.value).toEqual(message)

    await textArea.trigger('keydown', {
      key: 'Enter', // Send message
    })

    return message
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('moderateMessage', () => {
    test.each([
      {
        hateful_language: ['1', '2'],
        profanity: ['5hit'],
      },
      {
        hateful_language: ['1'],
      },
      { profanity: ['5hit'] },
      {
        hateful_language: ['1', '2'],
        profanity: undefined,
      },
      {
        hateful_language: ['1', '2'],
        profanity: [],
      },
    ])(
      'It renders the moderation failure reasons (failures=%s)',
      async (moderationFailures) => {
        ModerationService.checkIfMessageIsClean = vi.fn().mockResolvedValue({
          failures: moderationFailures,
        })
        const wrapper = getWrapper({
          user: {
            isVolunteer: true,
            isStudent: false,
          },
        })
        const message = await sendMessage(wrapper)
        await flushPromises()

        expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledWith({
          message,
          sessionId: currentSession.id,
        })
        expect(
          wrapper.find('[data-testid="moderation-body"]').isVisible()
        ).toBeTruthy()
        // Expect each reason to be rendered, as well as one additional div per reason
        // that contains the offending substrings
        const expectedDataTestIds = Object.keys(moderationFailures)
        Object.keys(moderationFailures).forEach((reason) => {
          expectedDataTestIds.push(`${reason}-instances`)
        })
        expect(expectedDataTestIds.length).toEqual(
          Object.keys(moderationFailures).length * 2
        )
        expectedDataTestIds.forEach((testId) => {
          expect(
            wrapper.find(`[data-testid="${testId}"]`).isVisible()
          ).toBeTruthy()
        })
      }
    )

    it('Does not render profanity for students', async () => {
      ModerationService.checkIfMessageIsClean = vi.fn().mockResolvedValue({
        failures: {
          profanity: ['5hit'],
          hateful_language: ['1'],
        },
      })
      const wrapper = getWrapper({
        user: {
          isStudent: true,
          isVolunteer: false,
        },
      })
      const message = await sendMessage(wrapper)
      await flushPromises()

      expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledWith({
        message,
        sessionId: currentSession.id,
      })
      expect(
        wrapper.find('[data-testid="moderation-body"]').isVisible()
      ).toBeTruthy()
      expect(
        wrapper.find('[data-testid="hateful_language"]').isVisible()
      ).toBeTruthy()
      expect(
        wrapper.find('[data-testid="hateful_language-instances"]').isVisible()
      ).toBeTruthy()
      expect(wrapper.find('[data-testid="profanity"]').exists()).toBeFalsy()
      expect(
        wrapper.find('[data-testid="profanity-instances"]').exists()
      ).toBeFalsy()
    })
  })

  describe('shouldShowPartnerAvatar', () => {
    test('shows avatar on the last message', async () => {
      const messages = [
        {
          user: 'student-id',
          contents: 'First message',
          createdAt: new Date(),
        },
        { user: 'student-id', contents: 'Last message', createdAt: new Date() },
      ]
      const wrapper = getWrapper({
        user: {
          state: { id: 'volunteer-id' },
          isVolunteer: true,
          isStudent: false,
        },
        currentSession: {
          id: '000',
          messages,
          volunteer: {
            id: 'volunteer-id',
          },
          student: {
            id: 'student-id',
          },
        },
      })

      expect(wrapper.vm.shouldShowPartnerAvatar(messages[0], 0)).toBe(false)
      expect(wrapper.vm.shouldShowPartnerAvatar(messages[1], 1)).toBe(true)
    })

    test('shows avatar when next message is from different user', () => {
      const messages = [
        {
          user: 'partner-id',
          contents: 'Partner message',
          createdAt: new Date(),
        },
        {
          user: 'current-user-id',
          contents: 'My message',
          createdAt: new Date(),
        },
      ]
      const wrapper = getWrapper({
        user: {
          state: { id: 'current-user-id' },
          isVolunteer: true,
          isStudent: false,
        },
        currentSession: {
          id: '111',
          messages,
          volunteer: {
            id: 'current-user-id',
          },
          student: {
            id: 'partner-id',
          },
        },
      })

      expect(wrapper.vm.shouldShowPartnerAvatar(messages[0], 0)).toBe(true)
    })
  })

  describe('shouldShowTimestamp', () => {
    test('shows timestamp on the last message only of consecutive messages from same user', () => {
      const messages = [
        {
          user: 'partner-id',
          contents: 'First message',
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          user: 'partner-id',
          contents: 'Middle message',
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          user: 'partner-id',
          contents: 'Last message',
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
      ]
      const wrapper = getWrapper({
        user: {
          state: { id: 'current-user-id' },
          isVolunteer: true,
          isStudent: false,
        },
        currentSession: {
          id: '222',
          messages,
          volunteer: {
            id: 'current-user-id',
          },
          student: {
            id: 'partner-id',
          },
        },
      })

      expect(wrapper.vm.shouldShowTimestamp(messages[0], 0)).toBe(false)
      expect(wrapper.vm.shouldShowTimestamp(messages[1], 1)).toBe(false)
      expect(wrapper.vm.shouldShowTimestamp(messages[2], 2)).toBe(true)
    })

    test('shows timestamp when next message is from different user', () => {
      const messages = [
        {
          user: 'partner-id',
          contents: 'Partner message',
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          user: 'current-user-id',
          contents: 'My message',
          createdAt: new Date('2025-01-01T10:00:00Z'),
        },
      ]
      const wrapper = getWrapper({
        user: {
          state: { id: 'current-user-id' },
          isVolunteer: true,
          isStudent: false,
        },
        currentSession: {
          id: '333',
          messages,
          volunteer: {
            id: 'current-user-id',
          },
          student: {
            id: 'partner-id',
          },
        },
      })

      wrapper.vm.withPendingMessages = messages

      expect(wrapper.vm.shouldShowTimestamp(messages[0], 0)).toBe(true)
      expect(wrapper.vm.shouldShowTimestamp(messages[1], 1)).toBe(true)
    })

    test('shows timestamp when different time between consecutive messages', () => {
      const messages = [
        {
          user: 'partner-id',
          contents: 'First message',
          createdAt: new Date('2023-01-01T10:00:00Z'),
        },
        {
          user: 'partner-id',
          contents: 'Second message',
          createdAt: new Date('2023-01-01T10:01:00Z'),
        },
      ]
      const wrapper = getWrapper({
        user: {
          state: { id: 'current-user-id' },
          isVolunteer: true,
          isStudent: false,
        },
        currentSession: {
          id: '444',
          messages,
          volunteer: {
            id: 'current-user-id',
          },
          student: {
            id: 'partner-id',
          },
        },
      })

      wrapper.vm.withPendingMessages = messages

      expect(wrapper.vm.shouldShowTimestamp(messages[0], 0)).toBe(true)
      expect(wrapper.vm.shouldShowTimestamp(messages[1], 1)).toBe(true)
    })
  })

  it('Disables sending chat message if not connected to the socket session room', async () => {
    const wrapper = getWrapper({ isSocketSessionRoomConnected: false })
    const message = await sendMessage(wrapper)
    await flushPromises()

    expect(ModerationService.checkIfMessageIsClean).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="chat-textarea"]').element.value).toBe(
      message
    )
  })
})
