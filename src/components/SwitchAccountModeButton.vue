<template>
  <div id="switch-account-mode-btn">
    <slot name="button" :message="message" :switchRole="switchRole">
      <div
        class="switch-role-button"
        id="switch-role-button"
        role="button"
        @click="switchRole"
      >
        {{ message }}
      </div>
    </slot>
    <Modal class="error-switching-modal" v-if="error">
      {{ error }}
      <LargeButton @click="closeErrorModal"> OK </LargeButton>
    </Modal>
    <OnboardingReminderPopover
      v-if="!isMobileSidebarOpen && !inASession && showFinishOnboardingReminder"
      :isOpen="showFinishOnboardingReminder"
      @dismissed="dismiss"
      @permanentlyDismissed="dismissPermanently"
      @finishedOnboarding="switchRole"
    />
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import LoggerService from '@/services/LoggerService'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import UserService from '@/services/UserService'
import { useStore } from 'vuex'
import Gleap from 'gleap'
import { capitalize } from 'lodash-es'
import OnboardingReminderPopover from '@/components/OnboardingReminderPopover.vue'

const router = useRouter()
const store = useStore()
const error = ref<string>('')

const userId = computed(() => store.state.user.user.id)
const userType = computed(() => store.getters['user/userType'])
const alternateRole = computed(() =>
  userType.value === 'student' ? 'volunteer' : 'student'
)
const alternateRoleNotOnboarded = computed(() => {
  return !store.state.user.user.isOnboarded && userType.value === 'student'
})

const message = computed(() => {
  return `Switch to ${capitalize(alternateRole.value)} View`
})

const dismissedOnboardingReminder = ref<boolean>(false)
const permanentlyDismissLocalStorageKey = computed(
  () =>
    `${store.state.user.user.id}-permanently-dismissed-continue-onboarding-reminder`
)
const showFinishOnboardingReminder = computed(() => {
  if (isMobileSidebarOpen.value) return false
  if (inASession.value) return false

  const localStorageValue = localStorage.getItem(
    permanentlyDismissLocalStorageKey.value
  )
  if (localStorageValue && localStorageValue === 'true') return false
  return alternateRoleNotOnboarded.value && !dismissedOnboardingReminder.value
})

const isMobileSidebarOpen = computed(
  () => store.getters['app/mobileMode'] && !store.state.app.sidebar.isCollapsed
)
const inASession = computed(() => store.getters['user/isSessionAlive'])

const dismissPermanently = () => {
  localStorage.setItem(permanentlyDismissLocalStorageKey.value, 'true')
  dismissedOnboardingReminder.value = true
}

const dismiss = () => {
  dismissedOnboardingReminder.value = true
}

const switchRole = async () => {
  const isOnDashboard = router.currentRoute.value.path === '/dashboard'
  try {
    const isGleapOpen = Gleap.isOpened()
    await UserService.switchActiveRole(
      { $store: store },
      userType.value === 'volunteer' ? 'student' : 'volunteer'
    )
    if (isOnDashboard) router.go(0)
    else {
      await router.replace('/dashboard')
      if (isGleapOpen) {
        Gleap.open()
      }
    }
  } catch (err) {
    LoggerService.noticeError(
      err?.message ?? 'Error while switching account modes',
      { userId }
    )
    error.value =
      'Something went wrong while switching account modes. Please refresh the page and try again, or reach out to support@upchieve.org for help.'
  }
}

const closeErrorModal = () => {
  error.value = ''
}
</script>

<style lang="scss">
.error-switching-modal {
  .upc-modal-form {
    gap: 18px;
  }
}

.switch-role-button {
  color: var(--switch-role-button-color);
  font-weight: 500;
}
</style>
