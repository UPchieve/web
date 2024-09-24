<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Subject } from './NewBotChat.vue'

const props = defineProps<{
  chat: { id: string; messagePreview: string }
  subject: Subject | undefined
}>()
const href = `/ai-tutor-conversations/${props.chat.id}`
</script>
<template>
  <RouterLink class="link" :to="href">
    {{ props.subject?.displayName }} -
    {{ props.chat.messagePreview }}</RouterLink
  >
</template>

<style lang="scss" scoped>
.link {
  color: black;
  line-height: 140%;
  padding: 8px 0;
}
</style>
