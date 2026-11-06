import DirectMessageChat from '@/components/DirectMessageChat.vue'
import { socket } from '@/socket'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import type { DirectMessage } from '@/types/direct-messages'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { dayjs } from '@/utils/time-utils'

vi.mock('@/services/NetworkService', () => ({
  default: {
    getOrCreateConversation: vi.fn(),
    getDirectMessages: vi.fn(),
    markConversationSeen: vi.fn(),
  },
}))

// Keeps the listeners the chat registers so tests can fire server events
const socketListeners = vi.hoisted(
  () => new Map<string, (data: unknown) => unknown>()
)
vi.mock('@/socket', () => ({
  socket: {
    emit: vi.fn(),
    on: vi.fn((event: string, listener: (data: unknown) => unknown) => {
      socketListeners.set(event, listener)
    }),
    off: vi.fn((event: string) => {
      socketListeners.delete(event)
    }),
  },
}))

async function receive(event: string, data: unknown) {
  await socketListeners.get(event)?.(data)
  await flushPromises()
}

vi.mock('@/services/LoggerService', () => ({
  default: {
    noticeError: vi.fn(),
  },
}))

const mockedNetworkService = vi.mocked(NetworkService)
const mockedSocket = vi.mocked(socket)
const mockedLoggerService = vi.mocked(LoggerService)
const removeUnreadDirectMessageSender = vi.fn()
const setActiveDirectMessagePartnerId = vi.fn(
  (
    state: { activeDirectMessagePartnerId: string | null },
    id: string | null
  ) => {
    state.activeDirectMessagePartnerId = id
  }
)
let store: ReturnType<typeof createStore>

const USER_ID = 'student-1'
const PARTNER_ID = 'coach-1'
const CONVERSATION_ID = 'conversation-1'

function directMessage(overrides: Partial<DirectMessage> = {}): DirectMessage {
  return {
    id: 'message-1',
    conversationId: CONVERSATION_ID,
    senderId: PARTNER_ID,
    contents: 'Hello!',
    createdAt: '2026-10-20T17:00:00',
    ...overrides,
  }
}

function mountChat() {
  store = createStore({
    modules: {
      user: {
        namespaced: true,
        state: { user: { id: USER_ID }, activeDirectMessagePartnerId: null },
        mutations: {
          removeUnreadDirectMessageSender,
          setActiveDirectMessagePartnerId,
        },
      },
    },
  })
  return mount(DirectMessageChat, {
    props: {
      partnerId: PARTNER_ID,
      partnerName: 'Alex',
    },
    global: {
      plugins: [store],
      stubs: { Loader: true },
    },
  })
}

function messageTexts(wrapper: ReturnType<typeof mountChat>) {
  return wrapper
    .findAll('[data-testid="dm-message"]')
    .map((message) => message.text())
}

describe('DirectMessageChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    socketListeners.clear()
    mockedNetworkService.getOrCreateConversation.mockResolvedValue({
      conversationId: CONVERSATION_ID,
    })
  })

  it('loads and shows the messages for the conversation', async () => {
    mockedNetworkService.getDirectMessages.mockResolvedValue({
      messages: [
        directMessage(),
        directMessage({ id: 'message-2', senderId: USER_ID, contents: 'Hi' }),
      ],
    })
    const wrapper = mountChat()
    await flushPromises()

    expect(mockedNetworkService.getOrCreateConversation).toHaveBeenCalledWith(
      PARTNER_ID
    )
    expect(mockedNetworkService.getDirectMessages).toHaveBeenCalledWith(
      CONVERSATION_ID
    )
    expect(messageTexts(wrapper)).toEqual(['Hello!', 'Hi'])
    const rows = wrapper.findAll('[data-testid="dm-message"]')
    expect(rows[0].classes()).toContain('message--theirs')
    expect(rows[1].classes()).toContain('message--mine')
  })

  it('labels each day once, above its first message', async () => {
    const today = dayjs()
    const yesterday = today.subtract(1, 'day')
    mockedNetworkService.getDirectMessages.mockResolvedValue({
      messages: [
        directMessage({ id: 'm1', createdAt: yesterday.toISOString() }),
        directMessage({ id: 'm2', createdAt: yesterday.toISOString() }),
        directMessage({ id: 'm3', createdAt: today.toISOString() }),
      ],
    })
    const wrapper = mountChat()
    await flushPromises()

    expect(
      wrapper.findAll('[data-testid="dm-day"]').map((day) => day.text())
    ).toEqual(['Yesterday', 'Today'])
  })

  it('asks to write a message to the partner in the composer', async () => {
    mockedNetworkService.getDirectMessages.mockResolvedValue({ messages: [] })
    const wrapper = mountChat()
    await flushPromises()

    expect(
      wrapper.find('[data-testid="dm-composer"]').attributes('placeholder')
    ).toBe('Write a message to Alex')
  })

  it('shows the empty state when there are no messages yet', async () => {
    mockedNetworkService.getDirectMessages.mockResolvedValue({ messages: [] })
    const wrapper = mountChat()
    await flushPromises()

    expect(wrapper.find('[data-testid="empty-state"]').text()).toContain(
      'Send Alex a message'
    )
  })

  it('shows an error and logs it when loading fails', async () => {
    const error = new Error('Network error')
    mockedNetworkService.getDirectMessages.mockRejectedValue(error)
    const wrapper = mountChat()
    await flushPromises()

    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(true)
    expect(mockedLoggerService.noticeError).toHaveBeenCalledWith(error)
  })

  it('shows an error and does not load messages when the conversation cannot be opened', async () => {
    const error = new Error('Not found')
    mockedNetworkService.getOrCreateConversation.mockRejectedValue(error)
    const wrapper = mountChat()
    await flushPromises()

    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(true)
    expect(mockedNetworkService.getDirectMessages).not.toHaveBeenCalled()
    expect(mockedLoggerService.noticeError).toHaveBeenCalledWith(error)
    expect(
      wrapper.find('[data-testid="dm-composer"]').attributes('disabled')
    ).toBeDefined()
  })

  async function mountWithNoMessages() {
    mockedNetworkService.getDirectMessages.mockResolvedValue({ messages: [] })
    const wrapper = mountChat()
    await flushPromises()
    return wrapper
  }

  function lastSentPayload() {
    const call = mockedSocket.emit.mock.calls.at(-1)!
    expect(call[0]).toBe('direct-message:send')
    return call[1] as { contents: string; clientMessageId: string }
  }

  it('sends the trimmed message over the socket and shows it as pending', async () => {
    const wrapper = await mountWithNoMessages()

    const composer = wrapper.find('[data-testid="dm-composer"]')
    await composer.setValue('  Thanks for the help  ')
    await wrapper.find('[data-testid="dm-send"]').trigger('click')

    expect(mockedSocket.emit).toHaveBeenCalledWith('direct-message:send', {
      conversationId: CONVERSATION_ID,
      contents: 'Thanks for the help',
      clientMessageId: expect.any(String),
    })
    expect(messageTexts(wrapper)).toEqual(['Thanks for the help'])
    expect(wrapper.find('[data-testid="dm-message"]').classes()).toContain(
      'message--pending'
    )
    expect((composer.element as HTMLTextAreaElement).value).toBe('')
  })

  it('replaces the pending message with the saved one', async () => {
    const wrapper = await mountWithNoMessages()
    await wrapper.find('[data-testid="dm-composer"]').setValue('Hi')
    await wrapper.find('[data-testid="dm-send"]').trigger('click')
    const { clientMessageId } = lastSentPayload()

    await receive('direct-message:new', {
      ...directMessage({ id: 'saved-1', senderId: USER_ID, contents: 'Hi' }),
      clientMessageId,
    })

    const rows = wrapper.findAll('[data-testid="dm-message"]')
    expect(rows).toHaveLength(1)
    expect(rows[0].classes()).not.toContain('message--pending')
  })

  it("shows the partner's new messages live", async () => {
    const wrapper = await mountWithNoMessages()

    await receive(
      'direct-message:new',
      directMessage({ id: 'live-1', contents: 'Are you free tomorrow?' })
    )

    expect(messageTexts(wrapper)).toEqual(['Are you free tomorrow?'])
    expect(wrapper.find('[data-testid="dm-message"]').classes()).toContain(
      'message--theirs'
    )
  })

  it('keeps messages received while the history is loading', async () => {
    let resolveMessages!: (value: { messages: DirectMessage[] }) => void
    mockedNetworkService.getDirectMessages.mockReturnValue(
      new Promise((resolve) => {
        resolveMessages = resolve
      })
    )
    const wrapper = mountChat()
    await flushPromises()

    const live = directMessage({
      id: 'live-1',
      contents: 'Sent during load',
      createdAt: '2026-10-20T18:00:00',
    })
    await receive('direct-message:new', live)
    resolveMessages({
      messages: [directMessage({ id: 'history-1', contents: 'Earlier' }), live],
    })
    await flushPromises()

    expect(messageTexts(wrapper)).toEqual(['Earlier', 'Sent during load'])
  })

  it('disables sending while the history is loading', async () => {
    mockedNetworkService.getDirectMessages.mockReturnValue(
      new Promise(() => {})
    )
    const wrapper = mountChat()
    await flushPromises()

    await wrapper.find('[data-testid="dm-composer"]').setValue('Hi')

    expect(
      wrapper.find('[data-testid="dm-send"]').attributes('disabled')
    ).toBeDefined()
  })

  it('does not add the same message twice', async () => {
    const wrapper = await mountWithNoMessages()
    const message = directMessage({ id: 'live-1' })

    await receive('direct-message:new', message)
    await receive('direct-message:new', message)

    expect(messageTexts(wrapper)).toEqual(['Hello!'])
  })

  it('ignores messages from other conversations', async () => {
    const wrapper = await mountWithNoMessages()

    await receive(
      'direct-message:new',
      directMessage({ conversationId: 'other-conversation' })
    )

    expect(messageTexts(wrapper)).toEqual([])
  })

  it('removes the pending message and gives the text back when sending fails', async () => {
    const wrapper = await mountWithNoMessages()
    const composer = wrapper.find('[data-testid="dm-composer"]')
    await composer.setValue('Hello')
    await wrapper.find('[data-testid="dm-send"]').trigger('click')
    const { clientMessageId } = lastSentPayload()

    await receive('direct-message:error', {
      conversationId: CONVERSATION_ID,
      clientMessageId,
    })

    expect(messageTexts(wrapper)).toEqual([])
    expect(wrapper.find('[data-testid="send-error"]').exists()).toBe(true)
    expect((composer.element as HTMLTextAreaElement).value).toBe('Hello')
  })

  it('sends on Enter but not on Shift+Enter', async () => {
    const wrapper = await mountWithNoMessages()

    const composer = wrapper.find('[data-testid="dm-composer"]')
    await composer.setValue('Hello')
    await composer.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(mockedSocket.emit).not.toHaveBeenCalled()

    await composer.trigger('keydown', { key: 'Enter' })
    expect(mockedSocket.emit).toHaveBeenCalledTimes(1)
  })

  it('disables sending when the message is blank', async () => {
    const wrapper = await mountWithNoMessages()

    await wrapper.find('[data-testid="dm-composer"]').setValue('   ')

    expect(
      wrapper.find('[data-testid="dm-send"]').attributes('disabled')
    ).toBeDefined()
  })

  it('stops listening for messages when closed', async () => {
    const wrapper = await mountWithNoMessages()

    wrapper.unmount()

    expect(mockedSocket.off).toHaveBeenCalledWith(
      'direct-message:new',
      expect.any(Function)
    )
    expect(mockedSocket.off).toHaveBeenCalledWith(
      'direct-message:error',
      expect.any(Function)
    )
  })

  describe('tracking the open chat', () => {
    function activePartnerId() {
      return (
        store.state as { user: { activeDirectMessagePartnerId: string | null } }
      ).user.activeDirectMessagePartnerId
    }

    it('marks the partner as the open chat when it mounts', async () => {
      await mountWithNoMessages()

      expect(activePartnerId()).toBe(PARTNER_ID)
    })

    it('switches to the new partner when the partner changes', async () => {
      const wrapper = await mountWithNoMessages()

      await wrapper.setProps({ partnerId: 'coach-2' })

      expect(activePartnerId()).toBe('coach-2')
    })

    it('clears the open chat when closed', async () => {
      const wrapper = await mountWithNoMessages()

      wrapper.unmount()

      expect(activePartnerId()).toBeNull()
    })

    it('leaves another open chat alone when closed', async () => {
      const wrapper = await mountWithNoMessages()
      store.commit('user/setActiveDirectMessagePartnerId', 'coach-2')

      wrapper.unmount()

      expect(activePartnerId()).toBe('coach-2')
    })
  })

  describe('marking the conversation seen', () => {
    it('marks it seen and clears the partner from unread once it loads', async () => {
      await mountWithNoMessages()

      expect(mockedNetworkService.markConversationSeen).toHaveBeenCalledWith(
        CONVERSATION_ID
      )
      expect(removeUnreadDirectMessageSender).toHaveBeenCalledTimes(1)
      expect(removeUnreadDirectMessageSender).toHaveBeenCalledWith(
        expect.anything(),
        PARTNER_ID
      )
    })

    it('does not mark it seen when the messages fail to load', async () => {
      mockedNetworkService.getDirectMessages.mockRejectedValue(
        new Error('Network error')
      )
      mountChat()
      await flushPromises()

      expect(mockedNetworkService.markConversationSeen).not.toHaveBeenCalled()
    })

    it('marks it seen again when a new message from the partner arrives', async () => {
      await mountWithNoMessages()
      vi.clearAllMocks()

      await receive('direct-message:new', directMessage())

      expect(mockedNetworkService.markConversationSeen).toHaveBeenCalledWith(
        CONVERSATION_ID
      )
      expect(removeUnreadDirectMessageSender).toHaveBeenCalledWith(
        expect.anything(),
        PARTNER_ID
      )
    })

    it("does not mark it seen for the user's own new messages", async () => {
      await mountWithNoMessages()
      vi.clearAllMocks()

      await receive(
        'direct-message:new',
        directMessage({ id: 'message-2', senderId: USER_ID })
      )

      expect(mockedNetworkService.markConversationSeen).not.toHaveBeenCalled()
    })

    it('logs the error without showing it when marking fails', async () => {
      const error = new Error('Network error')
      mockedNetworkService.markConversationSeen.mockRejectedValueOnce(error)
      const wrapper = await mountWithNoMessages()

      expect(mockedLoggerService.noticeError).toHaveBeenCalledWith(error)
      expect(removeUnreadDirectMessageSender).not.toHaveBeenCalled()
      expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(false)
    })
  })
})
