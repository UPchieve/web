<template>
  <IonToast
    :isOpen="props.show"
    :message="message"
    :header="heading"
    :icon="alertCircleOutline"
    :animated="true"
    position="middle"
    :buttons="moderationInfractionToastButtons"
    @didDismiss="props.onDismiss"
    :layout="mobileMode ? 'stacked' : 'baseline'"
    swipeGesture="vertical"
  />
</template>

<script lang="ts" setup>
import { IonToast } from '@ionic/vue'
import { computed } from 'vue'
import { useStore } from 'vuex'
import { alertCircleOutline } from 'ionicons/icons'

const props = defineProps<{
  show: false
  onDismiss: () => void
  onClickMoreInfo: () => void
}>()

const store = useStore()
const mobileMode = computed(() => store.getters['app/mobileMode'])
const moderationInfraction = computed(
  () => store.state.liveMedia.moderationInfraction
)

const heading = computed(
  () =>
    `Our automated moderation system detected a potential policy issue with your ${moderationInfractionSource.value}.`
)

const message = computed(() => {
  if (!moderationInfraction.value) return
  const infractions = moderationInfraction.value?.infraction ?? []
  return `Potential ${infractions.length > 1 ? 'violations' : 'violation'}: ${infractions.join(', ')}`
})

const moderationInfractionSource = computed(
  () => store.getters['liveMedia/moderationInfractionSource']
)

const moderationInfractionToastButtons = computed(() => {
  const dismissButton = {
    text: 'Dismiss',
    role: 'cancel',
    handler: props.onDismiss,
  }
  const buttons = [dismissButton]
  // Image uploads don't actually cause strikes against the user if they're censored,
  // so don't show them the modal about manual review.

  if (!moderationInfraction.value?.source?.includes('image_upload')) {
    buttons.push({
      text: 'More info',
      handler: props.onClickMoreInfo,
      role: 'button',
    })
  }
  return buttons
})
</script>
