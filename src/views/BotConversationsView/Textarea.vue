<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import SendMessage from '@/assets/voice_message_icons/send-message.svg'

const props = defineProps<{
  disabled: boolean
  sendMessage: (message: string) => void
}>()
const message = ref('')
const textareaRef = ref('textareaRef')
const messageIsEmpty = computed(() => message.value.trim().length === 0)
const send = () => {
  if (!messageIsEmpty.value) {
    props.sendMessage(message.value)
    message.value = ''
  }
}
onMounted(() => textareaRef.value.focus())
watch(
  () => props.disabled,
  () => {
    if (!props.disabled) {
      nextTick(() => textareaRef.value.focus())
    }
  }
)
</script>

<template>
  <div class="chat" :class="props.disabled ? 'disabled' : ''">
    <textarea
      autofocus
      ref="textareaRef"
      :disabled="props.disabled"
      placeholder="Chat with UPbot"
      v-model="message"
      @keydown.enter.prevent
      @keyup="
        (event) => {
          if (message.length === 0) return
          if (event.key === 'Enter') {
            send()
          }
        }
      "
    />
    <button
      :disabled="props.disabled || messageIsEmpty"
      class="send-button"
      @click="send"
    >
      <SendMessage></SendMessage>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.chat {
  display: flex;
  background-color: white;
  border: 1px solid $border-grey;
  border-radius: 11px;
  justify-content: end;
}

.chat.disabled,
.chat.disabled textarea {
  background-color: rgba(239, 239, 239, 0.3);
}

.chat textarea {
  border-radius: 11px;
  padding: 18px;
  width: 100%;
  height: 8em;
  resize: none;
  outline: none;
}
.send-button {
  padding-right: 18px;
  padding-bottom: 18px;
}
.send-button:hover:not(:disabled) {
  filter: brightness(0.9);
}
.send-button:disabled {
  filter: grayscale(0.75);
}
</style>
