<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import SendMessage from '@/assets/voice_message_icons/send-message.svg'

const props = defineProps<{
  disabled: boolean
  sendMessage: (message: string) => Promise<boolean>
}>()
const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const messageIsEmpty = computed(() => message.value.trim().length === 0)
const send = async () => {
  if (!messageIsEmpty.value) {
    const results = await props.sendMessage(message.value)
    if (results) {
      message.value = ''
    }
  }
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
const rows = ref(1)

const resizeTextAreaToFitText = () => {
  if (!textareaRef.value) return

  // Store initial values of padding
  const paddingTop = getComputedStyle(textareaRef.value).paddingTop
  const paddingBottom = getComputedStyle(textareaRef.value).paddingBottom

  /*
   * Reset textarea to 1 row and remove padding so we can get an accurate
   * measurment of the scrollheight
   *
   * NOTE: This isn't robust. If other CSS properties are added that modify
   * the height (i.e. margin, height, etc...) you will need to account for
   * those
   */
  textareaRef.value.rows = 1
  textareaRef.value.style.paddingTop = '0'
  textareaRef.value.style.paddingBottom = '0'
  const scrollHeight = textareaRef.value.scrollHeight

  /*
   * Calculate line height so we can get the number of lines we need
   * NOTE: parseInt is effectively rounding down the value
   */
  const computedLineHeight = parseInt(
    getComputedStyle(textareaRef.value).lineHeight,
    10
  )

  // Restore inital values
  textareaRef.value.style.paddingTop = paddingTop
  textareaRef.value.style.paddingBottom = paddingBottom
  textareaRef.value.rows = rows.value

  const lines = Math.floor(scrollHeight / computedLineHeight)
  rows.value = lines >= 5 ? 5 : lines
}

watch(() => message.value, resizeTextAreaToFitText)
</script>

<template>
  <div class="chat" :class="props.disabled ? 'disabled' : ''">
    <textarea
      autofocus
      ref="textareaRef"
      :disabled="props.disabled"
      placeholder="Chat with UPbot"
      v-model="message"
      :rows="rows"
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
  align-items: center;
}

.chat.disabled,
.chat.disabled textarea {
  background-color: rgba(239, 239, 239, 0.3);
}

.chat textarea {
  border-radius: 11px;
  padding: 18px;
  width: 100%;
  resize: none;
  outline: none;
  line-height: 140%;
}
.send-button {
  padding-right: 18px;
}
.send-button:hover:not(:disabled) {
  filter: brightness(0.9);
}
.send-button:disabled {
  filter: grayscale(0.75);
}
</style>
