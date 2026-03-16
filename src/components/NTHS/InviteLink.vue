<script setup lang="ts">
import config from '@/config'
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import ReferFriendIcon from '@/assets/icons/refer_friend_icon.svg'

const props = defineProps<{ code: string }>()
const copyMessage = ref('Copy Invite Link')
const link = computed(() => `${config.appRoot}/join-team/${props.code}`)

function copyURL() {
  copyMessage.value = 'Copied'

  const { copy } = useClipboard()
  copy(link.value)
  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_COPIED_TEAM_LINK, {
    inviteCode: props.code,
  })

  setTimeout(() => {
    copyMessage.value = 'Copy Invite Link'
  }, 1000)
}
</script>

<template>
  <div class="link-container">
    <refer-friend-icon class="icon" />
    <input type="text" autocomplete="off" class="link" :value="link" disabled />
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

<style scoped lang="scss">
.icon {
  width: 32px;
  height: 32px;
}
.link {
  font-size: large;
  padding: 0.5em 1em;
  background-color: white;
  border: 1px solid rgb(224, 224, 224);
  border-radius: 4px;
  flex-grow: 1;
  flex-shrink: 1;
  max-width: 100%;
}

.link-container {
  display: flex;
  gap: 8px;
  justify-content: start;
  align-items: center;
  width: 100%;
  @include breakpoint-above('medium') {
    justify-content: end;
  }
}
.button-container {
  flex-shrink: 0;
  flex-grow: 0;
}
.button-text {
  /* set width to keep form from jumping when text changes */
  color: #1855d1;
}
</style>
