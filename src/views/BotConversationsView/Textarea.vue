<script lang="ts" setup>
import { nextTick, onMounted, ref, watch, computed } from 'vue'
import SendMessage from '@/assets/voice_message_icons/send-message.svg'

const props = defineProps<{
  disabled: boolean
  placeholder?: string
  sendMessage: (message: string) => Promise<boolean>
}>()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const messageIsEmpty = computed(() => message.value.trim().length === 0)

async function send() {
  if (messageIsEmpty.value) return
  const messageSent = await props.sendMessage(message.value)
  if (messageSent) message.value = ''
}

onMounted(() => textareaRef.value?.focus())
watch(
  () => props.disabled,
  () => {
    if (!props.disabled) {
      nextTick(() => textareaRef.value?.focus())
    }
  }
)
</script>

<template>
  <div class="chat" :class="{ 'chat--disabled': props.disabled }">
    <textarea
      class="chat__input"
      autofocus
      autocomplete="off"
      ref="textareaRef"
      :disabled="props.disabled"
      :placeholder="placeholder ?? 'Chat with UPbot'"
      v-model="message"
      rows="3"
      @keydown.enter.prevent
      @keyup="
        (event) => {
          if (message.length === 0) return
          if (event.key === 'Enter') send()
        }
      "
    />
    <button
      type="button"
      :disabled="props.disabled || messageIsEmpty"
      class="chat__send-button"
      @click="send"
    >
      <SendMessage />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.chat {
  display: flex;
  background-color: $upchieve-white;
  border: 1px solid $border-grey;
  border-radius: 12px;
  align-items: center;

  &__input {
    width: 100%;
    padding: 0.6em 0.8em;
    resize: none;
    outline: none;
    line-height: 1.4;
    border-radius: inherit;
    border: none;
    // Auto-grow to fit content. Supported in Chrome 123+, Safari 17.4+.
    // As of today, Firefox ignores this and falls back to the HTML:
    // `rows="3"` — fixed-height with internal scroll past 3 rows.
    field-sizing: content;
    max-height: min(40vh, 400px);
  }

  &__send-button {
    padding-right: 18px;

    &:hover:not(:disabled) {
      filter: brightness(0.9);
    }

    &:disabled {
      filter: grayscale(0.75);
    }
  }

  &--disabled,
  &--disabled &__input {
    background-color: rgba(239, 239, 239, 0.3);
  }
}
</style>
