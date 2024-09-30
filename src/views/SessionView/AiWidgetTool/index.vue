<script lang="ts" setup>
import BotChat from '@/views/BotConversationsView/BotChat.vue'
import { onMounted } from 'vue'
import { useStore } from 'vuex'
import WidgetMessageComponent from '../WidgetMessageComponent.vue'
import WidgetTypingIndicatorComponent from '../WidgetTypingIndicatorComponent.vue'
import Errors from '@/views/BotConversationsView/Errors.vue'
const props = defineProps<{ conversationId: string }>()
const emit = defineEmits<{
  (e: 'minimize'): void
}>()
const store = useStore()
onMounted(async () => {
  await store.dispatch('botConversations/setConversation', props.conversationId)

  // Only add this notice once.
  // This will need to be rewritten if we use `system` for anything else
  if (
    !store.getters['botConversations/currentConversation'].messages.some(
      (m: { senderUserType: string }) => m.senderUserType === 'system'
    )
  )
    store.commit('botConversations/addToCurrentConversation', {
      senderUserType: 'system',
      message:
        '<b>Heads up!</b> Your tutor can now see our chat and ask me questions too. Feel free to keep asking me questions, even while chatting with your tutor.',
    })
})
</script>
<template>
  <div class="widget-container">
    <div class="header">
      <button @click="() => emit('minimize')" class="minimize">-</button>
    </div>
    <div class="body">
      <Errors></Errors>
      <BotChat
        class="overrides"
        bg-color="#fff"
        :message-component="WidgetMessageComponent"
        :typing-indiciator-component="WidgetTypingIndicatorComponent"
      ></BotChat>
    </div>
  </div>
</template>
<style lang="scss" scoped>
* {
  --header-height: 48px;
}
.widget-container {
  position: absolute;
  bottom: 140px;
  left: 44px;
  z-index: 1;
  height: 80vh;
  width: 400px;
  background-color: #fff;
  border-radius: 11px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  overflow-y: hidden;
  padding-top: var(--header-height);
}
.body {
  overflow-y: scroll;
  height: 100%;
  position: relative;
}
.overrides {
  padding-top: 18px;
  overflow-y: scroll;
  height: 100%;
}
.header {
  position: absolute;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: end;
  align-items: center;
  background-color: $c-information-blue;
}
.minimize {
  font-size: var(--header-height);
  font-weight: 300;
  color: white;
  line-height: 1em;
  padding: 0 18px;
}
</style>
