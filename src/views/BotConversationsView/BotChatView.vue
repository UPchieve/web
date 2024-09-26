<script setup lang="ts">
import { useStore } from 'vuex'
import { computed, onBeforeMount, onUnmounted } from 'vue'
import BotChat from './BotChat.vue'
import Errors from './Errors.vue'
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
</script>

<template>
  <div class="container">
    <Errors />

    <div class="row header">
      <span>
        <Math class="math-icon"></Math>&nbsp;
        <span class="subject">{{ subject }}</span></span
      >
    </div>

    <BotChat class="bot-chat"></BotChat>
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
  max-width: 768px;
}

.bot-chat {
  flex-grow: 1;
  overflow-y: auto;
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
</style>
