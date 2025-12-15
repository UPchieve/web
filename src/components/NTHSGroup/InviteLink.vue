<script setup lang="ts">
import config from '@/config'
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import ReferFriendIcon from '@/assets/icons/refer_friend_icon.svg'

const props = defineProps<{ code: string }>()
const copyMessage = ref('Copy Link')
const link = computed(() => `${config.appRoot}/join-team/${props.code}`)

function copyURL() {
  copyMessage.value = 'Copied'

  const { copy } = useClipboard()
  copy(link.value)
  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_COPIED_TEAM_LINK, {
    inviteCode: props.code,
  })

  setTimeout(() => {
    copyMessage.value = 'Copy Link'
  }, 1000)
}
</script>

<template>
  <div class="link-container">
    <refer-friend-icon class="icon" />
    <input type="text" class="link" :value="link" disabled />
    <div class="button-container">
      <LargeButton
        @click="copyURL"
        class="button-text"
        :show-arrow="false"
        variant="link"
      >
        <span>{{ copyMessage }}</span>
      </LargeButton>
    </div>
  </div>
</template>

<style scoped>
.icon {
  width: 32px;
  height: 32px;
}
.link {
  font-size: large;
  padding: 0.5em 1em;
  background-color: white;
  field-sizing: content;
  border: 1px solid rgb(224, 224, 224);
  border-radius: 4px;
}
.link-container {
  display: flex;
  gap: 8px;
  align-items: center;
}
.button-container {
  flex-shrink: 0;
}
.button-text {
  /* set width to keep form from jumping when text changes */
  width: 128px;
  color: #1855d1;
}
</style>
