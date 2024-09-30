<script setup lang="ts">
import { useStore } from 'vuex'
import { computed, onBeforeMount, onUnmounted } from 'vue'
import BotChat from './BotChat.vue'
import { useRoute } from 'vue-router'
import Math from '@/assets/subject_icons/math.svg'
import MessageComponent from '../SessionView/MessageComponent.vue'
import TypingIndicatorComponent from '../SessionView/TypingIndicatorComponent.vue'

const store = useStore()
const route = useRoute()

onBeforeMount(async () => {
  await store.dispatch('botConversations/fetchAllSubjects')
  await store.dispatch(
    'botConversations/setConversation',
    route.params.conversationId
  )
})
onUnmounted(
  async () => await store.dispatch('botConversations/resetCurrentConversation')
)

const conversation = computed(
  () => store.getters['botConversations/currentConversation']
)
const subject = computed(() => conversation.value?.subject?.displayName ?? '')
</script>

<template>
  <div class="bot-chat-view-container">
    <div class="header">
      <span>
        <Math class="math-icon"></Math>&nbsp;
        <span class="subject">{{ subject }}</span></span
      >
    </div>

    <BotChat
      :message-component="MessageComponent"
      :typing-indiciator-component="TypingIndicatorComponent"
    ></BotChat>
  </div>
</template>

<style lang="scss" scoped>
.bot-chat-view-container {
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
  overflow: hidden;
  position: relative;
}

.header {
  position: sticky;
  padding: 20px;
}

.math-icon {
  width: 48px;
  height: 48px;
}

.subject {
  font-size: 24px;
  font-weight: 500;
}
</style>
