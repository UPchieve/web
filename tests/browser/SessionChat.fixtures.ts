import { createStore } from 'vuex'

/**
 * Helper to generate ISO timestamp strings for test messages.
 */
const now = () => new Date().toISOString()

/**
 * Creates a mock Vuex store for SessionChat voice chat tests.
 * Includes in-progress caption messages for testing voice chat UI.
 *
 * @param overrides - Partial state/getters to override defaults
 * @returns Configured Vuex store instance
 */
export function createVoiceChatMockStore(
  overrides: {
    state?: Record<string, any>
    getters?: Record<string, any>
  } = {}
) {
  const defaultState = {
    user: {
      user: { id: 'user-1', firstName: 'Test' },
      unreadChatMessageIndices: [],
      chatScrolledToMessageIndex: null,
    },
    app: {
      isWebPageHidden: false,
    },
    socket: {
      isTyping: {},
      messageData: {},
    },
    liveMedia: {
      audio: {
        myInProgressCaptionMessage: { text: 'I am speaking right now...' },
        partnerInProgressCaptionMessage: { text: 'They are speaking too...' },
      },
    },
  }

  const defaultGetters = {
    'user/isVolunteer': () => false,
    'user/isStudent': () => true,
    'user/isSessionWaitingForVolunteer': () => false,
    'user/numberOfUnreadChatMessages': () => 0,
    'user/sessionPartner': () => ({ id: 'partner-1', firstName: 'Partner' }),
    'featureFlags/isDisplayVolunteerLanguagesEnabled': () => false,
    'featureFlags/isConfettiCelebrationEnabled': () => false,
    'featureFlags/isPendingMessagesEnabled': () => false,
    'featureFlags/isStudentsInitiateDmsEnabled': () => false,
  }

  return createStore({
    state: { ...defaultState, ...overrides.state },
    getters: { ...defaultGetters, ...overrides.getters },
  })
}

/**
 * Creates a mock session object for SessionChat voice chat tests.
 * Includes completed messages and audio transcriptions.
 *
 * @param overrides - Partial session properties to override defaults
 * @returns Mock session object
 */
export function createVoiceChatMockSession(
  overrides: Record<string, any> = {}
) {
  const defaultSession = {
    id: 'session-1',
    messages: [
      {
        contents:
          'This is a really long message from me to test how the chat interface handles multi-line messages with proper text wrapping and avatar alignment. It should wrap nicely and the avatar from the partner should align correctly with their subsequent message bubble.',
        user: 'user-1',
        createdAt: now(),
        type: 'text',
      },
      {
        contents: 'Hello, this is a completed message',
        user: 'partner-1',
        createdAt: now(),
        type: 'text',
      },
      {
        contents: 'This is a completed transcription',
        user: 'partner-1',
        createdAt: now(),
        type: 'audio-transcription',
      },
    ],
    student: { id: 'user-1', firstName: 'Test' },
    volunteer: { id: 'partner-1', firstName: 'Partner' },
    pendingMessages: [],
  }

  return { ...defaultSession, ...overrides }
}
