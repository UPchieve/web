<script setup lang="ts">
import { useStore } from 'vuex'
import { onMounted, computed, onBeforeMount, ref, watch, nextTick } from 'vue'
import BotChatMessages from './BotChatMessages.vue'
import Errors from './Errors.vue'
import { useRoute } from 'vue-router'
import Math from '@/assets/subject_icons/math.svg'
import Textarea from './Textarea.vue'
/* comment out for v1
import Logout from '@/assets/logout.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import LargeButton from '@/components/LargeButton.vue'
*/

const store = useStore()
const route = useRoute()
// const router = useRouter()
const user = computed(() => store.state.user.user)

const chatLog = ref(null)
const scrollToBottom = async () => {
  if (chatLog?.value?.scrollHeight) {
    await nextTick()
    chatLog.value.scrollTop = chatLog.value.scrollHeight
  }
}
onBeforeMount(() => {
  store.dispatch(
    'botConversations/setConversation',
    route.params.conversationId
  )
})
onMounted(() => scrollToBottom())

const conversation = computed(
  () => store.getters['botConversations/currentConversation']
)

const messageSending = computed(
  () => store.state.botConversations.messageIsSending
)
const fetchingConversation = computed(
  () => store.state.botConversations.isFetchingConversation
)
const messages = computed(() => conversation.value.messages ?? [])
const subject = computed(() => conversation.value?.subject?.displayName ?? '')

const sendMessage = async (message) => {
  const result = store.dispatch('botConversations/sendMessage', message)
  await result
}
watch(() => messages.value.length, scrollToBottom)

watch(
  () => route.params.conversationId,
  (conversationId) =>
    store.dispatch('botConversations/setConversation', conversationId)
)
</script>

<template>
  <div class="container">
    <Errors class="errors" />

    <div class="row header">
      <span>
        <Math class="math-icon"></Math>&nbsp;
        <span class="subject">{{ subject }}</span></span
      >
      <!-- comment out for v1 -->
      <!-- <div>
        <LargeButton @click="() => router.push('/ai-tutor-conversations')">
          Start new session
        </LargeButton>
        <button
          @click="
            () => {
              AnalyticsService.captureEvent(EVENTS.AI_TUTOR_EXIT)
              router.push('/dashboard')
            }
          "
        >
          <Logout class="exit"></Logout>
          Exit AI session
        </button>
      </div> -->
    </div>

    <div class="row chat-log" ref="chatLog">
      <BotChatMessages
        :user="user"
        :messages="messages"
        :messageSending="messageSending"
      />
    </div>

    <Textarea
      class="row"
      :disabled="messageSending || fetchingConversation"
      :sendMessage="(message: string) => sendMessage(message)"
    ></Textarea>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px;
  row-gap: 24px;
  position: relative;
}

.subject {
  font-size: 24px;
  font-weight: 500;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.math-icon {
  width: 48px;
  height: 48px;
}

.row {
  width: 100%;
  margin: 0 auto;
}

.title {
  font-size: 32;
  font-weight: 500;
}

.sub-title {
  font-size: 24;
  font-weight: 400;
}

.chat-log {
  flex-grow: 1;
  overflow-y: auto;
}

.request-tutor {
  align-content: center;
  justify-content: center;
}

.exit {
  width: 21px;
  height: 21px;
  transform: rotate(180deg);
}
</style>
