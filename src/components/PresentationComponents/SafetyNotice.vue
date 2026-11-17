<script lang="ts" setup>
export type SafetyNoticeType = 'session-chat' | 'direct-message-chat'

defineProps<{
  type: SafetyNoticeType
}>()

// We could potentially use this in other areas of code that require
// some sort of a safety notice, instead of restyling it every time.
const SAFETY_NOTICE_MESSAGES: Record<SafetyNoticeType, string> = {
  'session-chat': 'We review every session. Please be respectful.',
  'direct-message-chat': 'We review every conversation. Please be respectful.',
}
</script>

<template>
  <p class="safety-notice">{{ SAFETY_NOTICE_MESSAGES[type] }}</p>
</template>

<style lang="scss" scoped>
.safety-notice {
  @include font-category('helper-text');

  flex-shrink: 0;
  color: $c-default-grey;
  margin: $spacing-xs;
  text-align: center;
}
</style>
