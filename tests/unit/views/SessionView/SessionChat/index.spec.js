import { test, vi, describe, expect } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'
import SessionChat from '@/views/SessionView/SessionChat/index.vue'
import { storeOptions } from '@/store'
import ModerationService from '@/services/ModerationService'
import NetworkService from '@/services/NetworkService'

vi.mock('mathlive', () => ({}))
window.mathVirtualKeyboard = { container: null, hide: vi.fn() }

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
    const message = 'a message'
    const { editor } = wrapper.vm

    editor.commands.setContent(message)
    expect(editor.getText()).toEqual(message)

    editor.view.dom.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter' })
    )

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

  describe('getTipTapMessageText', () => {
    it('does not treat two currency amounts as math', () => {
      const wrapper = getWrapper()
      const message = 'It costs $5 to rent and $20 to buy'

      wrapper.vm.editor.commands.setContent(message)

      expect(wrapper.vm.getTipTapMessageText()).toEqual({
        text: message,
        isLatex: false,
      })
    })

    it('treats an inline math node as math', () => {
      const wrapper = getWrapper()
      wrapper.vm.editor.commands.setContent({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'The answer is ' },
              { type: 'inlineMath', attrs: { latex: 'x^2 + 3' } },
            ],
          },
        ],
      })

      expect(wrapper.vm.getTipTapMessageText()).toEqual({
        text: 'The answer is $x^2 + 3$',
        isLatex: true,
      })
    })
  })

  it('Sends a message when Enter comes right after typing', async () => {
    const wrapper = getWrapper()
    // Render first, so isComposerEmpty has cached the empty composer.
    await flushPromises()
    const message = await sendMessage(wrapper)
    await flushPromises()

    expect(ModerationService.checkIfMessageIsClean).toHaveBeenCalledWith({
      message,
      sessionId: currentSession.id,
    })
  })

  it('Disables sending chat message if not connected to the socket session room', async () => {
    const wrapper = getWrapper({ isSocketSessionRoomConnected: false })
    const message = await sendMessage(wrapper)
    await flushPromises()

    expect(ModerationService.checkIfMessageIsClean).not.toHaveBeenCalled()
    expect(wrapper.vm.editor.getText()).toBe(message)
  })

  describe('updateSessionLastSeen', () => {
    test('updates last seen for the current session and user on mount', async () => {
      NetworkService.updateSessionLastSeen = vi.fn().mockResolvedValue()
      getWrapper({
        user: { state: { id: 'user-1' } },
        currentSession: { id: 'abc', messages: [] },
      })
      await flushPromises()

      expect(NetworkService.updateSessionLastSeen).toHaveBeenCalledWith(
        'abc',
        'user-1'
      )
    })

    test('does not update last seen before the session has loaded', async () => {
      NetworkService.updateSessionLastSeen = vi.fn().mockResolvedValue()
      getWrapper({
        user: { state: { id: 'user-1' } },
        currentSession: { messages: [] },
      })
      await flushPromises()

      expect(NetworkService.updateSessionLastSeen).not.toHaveBeenCalled()
    })
  })
})
