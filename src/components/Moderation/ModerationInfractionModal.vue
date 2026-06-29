<template>
  <Modal class="moderation-infraction-info-modal upc-modal">
    <div class="header">
      <Warning class="warning-icon" src="@/assets/warning_icon.svg" />
      <h1>
        We detected a potential policy violation with your
        {{ moderationInfractionSource }}
      </h1>
    </div>
    <br />
    <div class="infraction-modal-body">
      <p
        v-if="
          props.moderationInfraction?.stopStreamImmediatelyReasons?.length ||
          props.moderationInfraction.infraction
        "
        data-testid="potential-policy-violations"
      >
        Potential policy violations: <b>{{ reasons }}</b>
      </p>
      <p v-if="detailedMessage" data-testid="infraction-detail">
        {{ detailedMessage }}
      </p>
      <p>
        Don't worry, we'll manually review to confirm if this was a mistake. If
        you need support, send us a message or email us at support@upchieve.org.
      </p>
      <p>Thanks for your patience!</p>
      <LargeButton @click="emit('close')" :show-arrow="false" variant="primary"
        >Close</LargeButton
      >
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import { useStore } from 'vuex'
import Warning from '@/assets/warning.svg'

const props = defineProps<{
  moderationInfraction: {
    isBanned: boolean
    stopStreamImmediatelyReasons?: string[]
    infraction: string[]
    source: string
  }
}>()

const reasons = computed(() => {
  const reasonsList = new Set<string>(
    props.moderationInfraction.stopStreamImmediatelyReasons?.length
      ? props.moderationInfraction.stopStreamImmediatelyReasons
      : props.moderationInfraction.infraction
  )
  return Array.from(reasonsList).join(', ')
})

const RESHARE_SCREEN_MESSAGE = `Please check the content of your screen for any potentially problematic content, and remove it before sharing your screen again. `
const detailedMessage = computed(() => {
  if (props.moderationInfraction.source === 'whiteboard_text_node') {
    return
  }

  let message =
    "For everyone's safety, your screen share and microphone have been disabled. "
  if (
    props.moderationInfraction.stopStreamImmediatelyReasons?.length &&
    !props.moderationInfraction.isBanned &&
    props.moderationInfraction.source === 'screenshare'
  ) {
    message += RESHARE_SCREEN_MESSAGE
  }
  return message
})

const store = useStore()
const emit = defineEmits(['close'])

const moderationInfractionSource = computed(
  () => store.getters['liveMedia/moderationInfractionSource']
)
</script>

<style lang="scss" scoped>
.moderation-infraction-info-modal {
  display: flex;
  flex-direction: column;
  justify-content: center;

  .infraction-modal-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 0;
  }

  .warning-icon {
    height: 2.4rem;
    width: 3rem;
  }

  .header {
    display: flex;
    column-gap: 8px;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
