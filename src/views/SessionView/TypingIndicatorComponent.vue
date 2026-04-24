<script lang="ts" setup>
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
const props = defineProps<{ messageSending: boolean }>()
</script>
<template>
  <div class="left message-container" v-if="props.messageSending">
    <ChatBotIcon class="chat-bot-icon"></ChatBotIcon>
    <div class="message typing-indicator">typing...</div>
  </div>
</template>
<style lang="scss" scoped>
.message-container {
  display: flex;
  width: 100%;
  gap: 27px;
  margin-left: auto;
  margin-right: auto;
}
.chat-bot-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  margin-top: 12px;
}

.message {
  max-width: 80%;
  line-height: 160%;
  overflow-wrap: break-word;
  font-size: 18px;
  font-family: system-ui, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding-top: 0.625em;
  padding-bottom: 0.625em;
  white-space: pre-line;
  text-align: left;
}
.typing-indicator:after {
  overflow: hidden;
  display: inline-block;
  vertical-align: bottom;
  -webkit-animation: ellipsis steps(4, end) 900ms infinite;
  animation: ellipsis steps(4, end) 900ms infinite;
  content: '\2026'; /* ascii code for the ellipsis character */
  width: 0px;
}

@keyframes ellipsis {
  to {
    width: 1.25em;
  }
}

@-webkit-keyframes ellipsis {
  to {
    width: 1.25em;
  }
}
</style>
