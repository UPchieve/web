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
  align-items: end;
  padding-left: 20px;
  padding-right: 20px;
}

.message {
  max-width: 80%;
  line-height: 140%;
  overflow-wrap: break-word;
  font-size: 16px;
  font-family: $font-family-default;
  white-space: pre-line;
  text-align: left;
  border-radius: 20px;
  padding: 10px 16px;
}

.chat-bot-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
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
