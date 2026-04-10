<script lang="ts" setup>
import { IonPopover, IonContent, IonIcon } from '@ionic/vue'
import { chevronBackOutline } from 'ionicons/icons'
import CrossIcon from '@/assets/cross.svg'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { useStore } from 'vuex'
import { computed, onMounted } from 'vue'

const store = useStore()
const props = defineProps<{
  isOpen: boolean
}>()
const mobileMode = computed(() => store.getters['app/mobileMode'])
const isMobileLandscape = computed(() => store.getters['app/isMobileLandscape'])

const anchorElementId = computed(() =>
  mobileMode.value ? 'mobile-hamburger-btn' : 'switch-account-mode-btn'
)
const offsetX = computed(() => (mobileMode.value ? '0px' : '10px'))
const offsetY = computed(() => (mobileMode.value ? '10px' : '-5px'))
const position = computed(() => (mobileMode.value ? 'bottom' : 'right'))

const emit = defineEmits([
  'dismissed',
  'permanentlyDismissed',
  'finishedOnboarding',
])

onMounted(() => {
  AnalyticsService.captureEvent(
    EVENTS.ROLE_SWITCHING_SAW_ONBOARDING_REMINDER_POPOVER
  )
})

const temporarilyDismiss = () => {
  AnalyticsService.captureEvent(
    EVENTS.ROLE_SWITCHING_DISMISSED_ONBOARDING_REMINDER_POPOVER
  )
  emit('dismissed')
}

const permanentlyDismiss = () => {
  AnalyticsService.captureEvent(
    EVENTS.ROLE_SWITCHING_PERMANENTLY_DISMISSED_ONBOARDING_REMINDER_POPOVER
  )
  emit('permanentlyDismissed')
}

const finishOnboarding = () => {
  AnalyticsService.captureEvent(EVENTS.ROLE_SWITCHING_CLICKED_FINISH_ONBOARDING)
  emit('finishedOnboarding')
}
</script>

<template>
  <IonPopover
    :isOpen="props.isOpen"
    :class="{
      'onboarding-popover': true,
      'onboarding-popover-mobile': mobileMode,
    }"
    :style="{
      '--offset-x': offsetX,
      '--offset-y': offsetY,
    }"
    reference="trigger"
    :side="position"
    :trigger="anchorElementId"
    @didDismiss="temporarilyDismiss"
  >
    <IonContent class="onboarding-popover-content">
      <div class="heading">
        <IonIcon
          v-if="!mobileMode && !isMobileLandscape"
          :icon="chevronBackOutline"
          color="primary"
        />
        <span class="heading-text">You're almost ready to tutor!</span>
        <button
          type="button"
          @click="temporarilyDismiss"
          class="dismiss-button"
        >
          <CrossIcon class="dismiss-icon" />
        </button>
      </div>
      <div class="content">
        Switch to Volunteer Mode to<br />finish onboarding!
        <div class="buttons">
          <LargeButton variant="secondary" @click="permanentlyDismiss"
            >Don't show this again</LargeButton
          >
          <LargeButton
            variant="primary"
            :showArrow="false"
            @click="finishOnboarding"
          >
            Finish onboarding!
          </LargeButton>
        </div>
      </div>
    </IonContent>
  </IonPopover>
</template>

<style lang="scss" scoped>
.onboarding-popover-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.heading {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;

  .heading-text {
    font-weight: 500;
    margin-right: auto;
    margin-left: auto;
  }

  .dismiss-button {
    .dismiss-icon {
      width: 15px;
      height: 15px;
    }

    &:focus-visible {
      outline: none;
    }
  }
}

.content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 8px 8px 8px;
}

ion-popover::part(content) {
  border-radius: 10px;
  padding: 8px;
}

ion-popover.onboarding-popover {
  --min-width: 300px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
}
</style>
