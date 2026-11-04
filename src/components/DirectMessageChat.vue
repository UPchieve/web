<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { socket } from '@/socket'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import Loader from '@/components/Loader.vue'
import SendMessageIcon from '@/assets/voice_message_icons/send-message.svg'
import { dayjs } from '@/utils/time-utils'
import type {
  DirectMessage,
  DirectMessageErrorEvent,
  NewDirectMessageEvent,
  SendDirectMessagePayload,
} from '@/types/direct-messages'

type ChatMessage = DirectMessage & {
  clientMessageId?: string
  pending?: boolean
}

const props = defineProps<{
  partnerId: string
  partnerName: string
}>()

const store = useStore()
const userId = computed<string>(() => store.state.user.user.id)

const conversationId = ref<string | null>(null)
const messages = ref<ChatMessage[]>([])
const isLoading = ref(true)
const loadError = ref('')
const draft = ref('')
const sendError = ref('')
const messagesBox = ref<HTMLElement | null>(null)
const composerInput = ref<HTMLTextAreaElement | null>(null)

const isSendDisabled = computed(
  () =>
    !conversationId.value || isLoading.value || draft.value.trim().length === 0
)

// The conversation is created the first time either person opens it
async function loadConversation() {
  isLoading.value = true
  loadError.value = ''
  conversationId.value = null
  messages.value = []
  try {
    const conversation = await NetworkService.getOrCreateConversation(
      props.partnerId
    )
    conversationId.value = conversation.conversationId
    const response = await NetworkService.getDirectMessages(
      conversation.conversationId
    )
    messages.value = mergeMessages(response.messages, messages.value)
    isLoading.value = false
    await scrollToBottom()
  } catch (err) {
    LoggerService.noticeError(err)
    conversationId.value = null
    loadError.value =
      'We were unable to load your messages. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

// Combine fetched history with messages that arrived during the fetch,
// dedupe by id and keep chronological order
function mergeMessages(fetched: ChatMessage[], live: ChatMessage[]) {
  const fetchedIds = new Set(fetched.map((m) => m.id))
  return [...fetched, ...live.filter((m) => !fetchedIds.has(m.id))].sort(
    (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
  )
}

async function sendMessage() {
  if (isSendDisabled.value || !conversationId.value) return

  const contents = draft.value.trim()
  const clientMessageId = crypto.randomUUID()
  messages.value.push({
    id: clientMessageId,
    clientMessageId,
    conversationId: conversationId.value,
    senderId: userId.value,
    contents,
    createdAt: new Date().toISOString(),
    pending: true,
  })
  draft.value = ''
  sendError.value = ''

  const payload: SendDirectMessagePayload = {
    conversationId: conversationId.value,
    contents,
    clientMessageId,
  }
  socket.emit('direct-message:send', payload)
  await scrollToBottom()
}

async function handleNewMessage(data: NewDirectMessageEvent) {
  if (data.conversationId !== conversationId.value) return

  const { clientMessageId, ...message } = data
  // When we send a message, sendMessage adds a pending copy right away,
  // keyed by a temporary clientMessageId. The server echoes that id back
  // with the saved message, so we swap the pending copy for the saved one
  // in place instead of adding a duplicate.
  const pendingIndex = clientMessageId
    ? messages.value.findIndex((m) => m.clientMessageId === clientMessageId)
    : -1
  if (pendingIndex > -1) {
    messages.value.splice(pendingIndex, 1, message)
    return
  }

  if (messages.value.some((m) => m.id === message.id)) return
  messages.value.push(message)
  await scrollToBottom()
}

function handleSendError(data: DirectMessageErrorEvent) {
  if (data.conversationId !== conversationId.value) return

  const pendingIndex = messages.value.findIndex(
    (m) => m.pending && m.clientMessageId === data.clientMessageId
  )
  if (pendingIndex === -1) return
  const [failed] = messages.value.splice(pendingIndex, 1)
  if (!draft.value) draft.value = failed.contents
  sendError.value = 'Your message could not be sent. Please try again.'
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messagesBox.value)
    messagesBox.value.scrollTop = messagesBox.value.scrollHeight
}

function isFromMe(message: DirectMessage) {
  return message.senderId === userId.value
}

function formatDay(createdAt: string) {
  const day = dayjs(createdAt)
  const today = dayjs()
  if (day.isSame(today, 'day')) return 'Today'
  if (day.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday'
  return day.isSame(today, 'year')
    ? day.format('MMM D')
    : day.format('MMM D, YYYY')
}

function formatTime(createdAt: string) {
  return dayjs(createdAt).format('h:mm a')
}

function shouldShowDay(index: number) {
  if (index === 0) return true
  return !dayjs(messages.value[index].createdAt).isSame(
    messages.value[index - 1].createdAt,
    'day'
  )
}

async function resizeComposer() {
  await nextTick()
  const input = composerInput.value
  if (!input) return
  input.style.height = 'auto'
  input.style.height = `${input.scrollHeight}px`
}

watch(() => props.partnerId, loadConversation, { immediate: true })
watch(draft, resizeComposer)

onMounted(() => {
  socket.on('direct-message:new', handleNewMessage)
  socket.on('direct-message:error', handleSendError)
})

onUnmounted(() => {
  socket.off('direct-message:new', handleNewMessage)
  socket.off('direct-message:error', handleSendError)
})
</script>

<template>
  <section class="dm-chat" :aria-label="`Messages with ${partnerName}`">
    <div ref="messagesBox" class="messages" tabindex="0">
      <loader
        v-if="isLoading"
        message="Loading your messages"
        class="dm-chat__loader"
      />
      <p v-else-if="loadError" class="dm-chat__info" data-testid="load-error">
        {{ loadError }}
      </p>
      <p
        v-else-if="!messages.length"
        class="dm-chat__info"
        data-testid="empty-state"
      >
        Send {{ partnerName }} a message to keep the conversation going.
      </p>
      <div v-else class="messages__list">
        <template v-for="(message, index) in messages" :key="message.id">
          <p
            v-if="shouldShowDay(index)"
            class="messages__day"
            data-testid="dm-day"
          >
            {{ formatDay(message.createdAt) }}
          </p>
          <div
            class="message"
            :class="[
              isFromMe(message) ? 'message--mine' : 'message--theirs',
              { 'message--pending': message.pending },
            ]"
            :title="formatTime(message.createdAt)"
            data-testid="dm-message"
          >
            {{ message.contents }}
          </div>
        </template>
      </div>
    </div>

    <footer class="dm-chat__footer">
      <p v-if="sendError" class="dm-chat__send-error" data-testid="send-error">
        {{ sendError }}
      </p>
      <div class="composer">
        <textarea
          ref="composerInput"
          v-model="draft"
          class="composer__input"
          data-testid="dm-composer"
          rows="1"
          :placeholder="`Write a message to ${partnerName}`"
          aria-label="Message"
          :disabled="isLoading || !!loadError"
          @keydown="handleKeydown"
          autocomplete="off"
        />
        <button
          type="button"
          class="composer__send"
          data-testid="dm-send"
          aria-label="Send message"
          :disabled="isSendDisabled"
          @click="sendMessage"
        >
          <SendMessageIcon />
        </button>
      </div>
    </footer>
  </section>
</template>

<style lang="scss" scoped>
.dm-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: $c-background-grey;

  &__loader {
    margin: 3rem 0;
    @include flex-container(column, center, center);
  }

  &__info {
    margin: auto 1.5rem 2rem;
    text-align: center;
    color: $c-secondary-grey;
  }

  &__footer {
    padding: 16px 24px 24px;
    background-color: $upchieve-white;
  }

  &__send-error {
    margin: 0 0 8px;
    color: $c-error-red;
    font-size: 14px;
  }
}

.messages {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
  }

  &__day {
    margin: 12px 0 4px;
    text-align: center;
    color: $c-secondary-grey;
    font-size: 14px;
  }
}

.message {
  max-width: 85%;
  padding: 12px 20px;
  border-radius: 20px;
  line-height: 1.5;
  text-align: left;
  white-space: pre-line;
  overflow-wrap: anywhere;

  &--mine {
    align-self: flex-end;
    border-bottom-right-radius: 4px;
    background-color: $c-information-blue;
    color: $upchieve-white;
  }

  &--pending {
    opacity: 0.6;
  }

  &--theirs {
    align-self: flex-start;
    border: 1px solid $c-border-grey;
    background-color: $upchieve-white;
    color: $c-soft-black;
  }
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 6px 6px 6px 20px;
  border: 2px solid $c-border-grey;
  border-radius: 28px;
  background-color: $upchieve-white;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: $c-information-blue;
    box-shadow: 0 0 0 4px rgba($c-information-blue, 0.15);
  }

  &__input {
    flex: 1;
    min-width: 0;
    max-height: 120px;
    overflow-y: auto;
    scrollbar-width: thin;
    padding: 8px 0;
    border: none;
    outline: none;
    resize: none;
    background: none;
    font: inherit;
    line-height: 1.5;
    color: $c-soft-black;

    &::placeholder {
      color: $c-secondary-grey;
    }
  }

  &__send {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    height: 40px;
    padding-left: 8px;
    background: none;
    border: none;
    cursor: pointer;

    &:hover:not(:disabled) {
      filter: brightness(0.9);
    }

    &:disabled {
      cursor: default;

      :deep(circle) {
        fill: $c-disabled-grey;
      }
    }
  }
}
</style>
