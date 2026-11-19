<script setup lang="ts">
import { ref } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import { useInviteLink } from '@/composables/useInviteLink'

const props = defineProps<{ code: string; referralCode: string }>()
const linkElement = ref<HTMLElement>()
const { link, justCopied, copyLink } = useInviteLink(
  () => props.code,
  () => props.referralCode
)

// copyLink copies through a hidden textarea, which would clear a selection
// made before it, so copy first.
function selectAndCopyURL() {
  copyLink()
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
        @click="copyLink"
        class="button-text"
        :show-arrow="false"
        variant="primary-blue"
      >
        <span>{{ justCopied ? 'Copied' : 'Copy link' }}</span>
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
