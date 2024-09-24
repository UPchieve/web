<script setup lang="ts">
import Gleap from 'gleap'
import LoggerService from '../../services/LoggerService'
import { useStore } from 'vuex'
import { onBeforeMount, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
/* commenting out for v1
import BotHistoryBar from './BotHistoryBar.vue'
import LinkToChat from './LinkToChat.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import StudentIcon from '@/assets/student-icon.svg'
*/

const route = useRoute()
onBeforeMount(async () => {
  store.dispatch('botConversations/fetchAllSubjects')
  /* comment out for v1
  store.dispatch('botConversations/fetchAllConversations')
  store.dispatch('app/hideNavigation')
  store.dispatch('app/header/show')
  store.dispatch('app/sidebar/hide')
  */
  try {
    Gleap.showFeedbackButton(false)
  } catch {
    LoggerService.noticeError('Failed when hiding Gleap feedback button')
  }
})

watch(
  () => route.path,
  () => {
    /* comment out for v1
      store.dispatch('app/hideNavigation')
      store.dispatch('app/header/show')
      store.dispatch('app/sidebar/hide')
     store.dispatch('botConversations/fetchAllConversations')
    */
    if (
      route.path === '/ai-tutor-conversations' ||
      route.path === '/ai-tutor-conversations/'
    ) {
      store.dispatch('botConversations/resetCurrentConversation')
    }
  }
)

const store = useStore()

/* commenting out for v1
const chatHistory = computed(
  () => store.getters['botConversations/userConversations']
)
const currentConversation = computed(
  () => store.getters['botConversations/currentConversation']
)
const subjects = computed(() => store.state.botConversations.subjects)
const mobileMode = computed(() => store.getters['app/mobileMode'])
const recentChatHistory = computed(() => {
  return [...chatHistory.value]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .filter(({ id }) => id !== currentConversation.value?.conversationId)
})
*/
</script>

<template>
  <div class="layout">
    <!-- commenting out for v1 -->
    <!-- <BotHistoryBar class="history-bar" v-if="!mobileMode">
      <div>
        <ChatBotIcon v-if="currentConversation.conversationId" class="avatar" />
        <StudentIcon class="avatar" />
      </div>
      <div class="indicator-container">
        <span
          class="indicator"
          :class="currentConversation.conversationId ? 'green' : 'red'"
        ></span
        >AI in session
      </div>
      <div v-if="currentConversation.conversationId">
        <div class="history-label">Current Session</div>
        <div>
          {{ currentConversation.subject?.displayName }} -
          {{ currentConversation?.messagePreview }}
        </div>
      </div>
      <div class="history-label">Recent Sessions</div>
      <LinkToChat
        v-for="chat in recentChatHistory"
        :key="chat.id"
        :chat="chat"
        :subject="
          subjects.find((s: Partial<{ id: string }>) => s.id === chat.subjectId)
        "
      />
    </BotHistoryBar> -->
    <RouterView></RouterView>
  </div>
</template>

<style scoped lang="scss">
.avatar {
  width: 50px;
  height: 50px;
}
.avatar:nth-child(2) {
  margin-left: -8px;
}
.indicator-container {
  padding-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 72px;
}
.indicator {
  border-radius: 4px;
  height: 8px;
  width: 8px;
}
.green {
  background-color: $c-success-green;
}
.red {
  background-color: $c-error-red;
}

.layout {
  height: 100%;
  display: flex;
}

.history-bar {
  width: 300px;
  background-color: white;
  padding: 36px;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.bot-chat {
  max-width: 768px;
}
.history-label {
  font-size: 14px;
  font-weight: 400;
  color: #666f7d;
  padding-top: 24px;
  padding-bottom: 8px;
}
</style>
