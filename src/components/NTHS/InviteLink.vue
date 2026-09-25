<script setup lang="ts">
import config from '@/config'
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'

const props = defineProps<{ code: string }>()
const copyMessage = ref('Copy link')
const linkElement = ref<HTMLElement>()
const link = computed(() => `${config.appRoot}/join-team/${props.code}`)

function copyURL() {
  copyMessage.value = 'Copied'

  const { copy } = useClipboard()
  copy(link.value)
  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_COPIED_TEAM_LINK, {
    inviteCode: props.code,
  })

  setTimeout(() => {
    copyMessage.value = 'Copy link'
  }, 1000)
}

// useClipboard is created here on each click, so its async permission check
// hasn't resolved yet and it always copies through a hidden textarea; copy
// first, since that textarea would clear a selection made before it.
function selectAndCopyURL() {
  copyURL()
  window.getSelection()?.selectAllChildren(linkElement.value!)
}
</script>

<template>
  <div class="link-container">
    <span
      ref="linkElement"
      class="link"
      data-testid="invite-link-url"
      v-ph:nthshq="'home.invite.link'"
      @click="selectAndCopyURL"
      >{{ link }}</span
    >
    <div class="button-container">
      <LargeButton
        v-ph:nthshq="'home.invite.copy'"
        @click="copyURL"
        class="button-text"
        :show-arrow="false"
        variant="primary-blue"
      >
        <span>{{ copyMessage }}</span>
      </LargeButton>
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.link {
  display: block;
  font-size: 15px;
  line-height: 1.3;
  padding: 12px 14px;
  color: $c-default-grey;
  background-color: $upchieve-white;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  word-break: break-all;
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 180px;
  cursor: pointer;
}

.link-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: start;
  align-items: center;
  width: 100%;
  @include breakpoint-above('medium') {
    justify-content: space-between;
  }
}
.button-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  flex-grow: 0;

  // On a phone the link box and the button would otherwise overflow the
  // card that hosts this component.
  @include breakpoint-below('medium') {
    flex-grow: 1;

    > * {
      width: 100%;
    }
  }
}
.button-text {
  padding: 11px 22px;
  font-size: 15px;
}
</style>
