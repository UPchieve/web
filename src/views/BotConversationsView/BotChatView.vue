<script setup lang="ts">
import { useStore } from 'vuex'
import { computed, onBeforeMount, onUnmounted } from 'vue'
import BotChat, { DISPLAY_CONTEXT } from './BotChat.vue'
import { useRoute } from 'vue-router'
import Math from '@/assets/subject_icons/math.svg'

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
const isMobileMode = computed(() => store.getters['app/mobileMode'])
</script>

<template>
  <div
    :class="{
      'bot-chat-view-container': true,
      'web-chat-padding': !isMobileMode,
    }"
  >
    <div class="header">
      <span>
        <Math class="math-icon"></Math>&nbsp;
        <span class="subject">{{ subject }}</span></span
      >
    </div>

    <BotChat :displayContext="DISPLAY_CONTEXT.STAND_ALONE"></BotChat>
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

.web-chat-padding {
  padding-bottom: 80px;
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
