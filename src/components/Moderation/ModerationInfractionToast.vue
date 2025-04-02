<template>
  <IonToast
    :isOpen="props.show"
    :message="message"
    :header="heading"
    icon="alert-circle-outline"
    :animated="true"
    position="middle"
    :duration="props.requireClickMoreInfoToDismiss ? 0 : 5000"
    :buttons="moderationInfractionToastButtons"
    @didDismiss="props.onDismiss"
    :layout="mobileMode ? 'stacked' : 'baseline'"
  />
</template>

<script lang="ts" setup>
import { IonToast } from '@ionic/vue'
import { computed } from 'vue'
import { useStore } from 'vuex'

const props = defineProps<{
  show: false
  onDismiss: Function
  onClickMoreInfo: Function
  requireClickMoreInfoToDismiss: false
}>()

const store = useStore()
const mobileMode = computed(() => store.getters['app/mobileMode'])
const moderationInfraction = computed(
  () => store.state.liveMedia.moderationInfraction
)

const heading = computed(() =>
  moderationInfraction.value?.isBanned
    ? 'We have temporarily disabled your screenshare and microphone use due to a potential policy violation.'
    : `Our automated moderation system detected a potential policy issue with your ${moderationInfractionSource.value} use.`
)

const message = computed(() => {
  if (!moderationInfraction.value) return
  const infractions = moderationInfraction.value?.infraction ?? []
  return `Potential ${moderationInfraction.value?.infraction.length > 0 ? 'violations' : 'violation'}: ${infractions.join(', ')}`
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
  const buttons = []
  if (!props.requireClickMoreInfoToDismiss) {
    buttons.push(dismissButton)
  }
  // Image uploads don't actually cause strikes against the user if they're censored,
  // so don't show them the modal about manual review.
  if (moderationInfraction.value?.source !== 'image_upload') {
    buttons.push({
      text: 'More info',
      handler: props.onClickMoreInfo,
    })
  }
  return buttons
})
</script>
