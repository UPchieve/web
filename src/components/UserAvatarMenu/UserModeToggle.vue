<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { storeToRefs } from 'pinia'
import type { SessionStatus } from '@/store/modules/user'
import UserService from '@/services/UserService'
import LoggerService from '@/services/LoggerService'
import { useRouter } from 'vue-router'
import { useSessionOfferStore } from '@/stores/session-offer'

const store = useStore()
const router = useRouter()
const { isInQueue } = storeToRefs(useSessionOfferStore())
const userType = computed(() => store.getters['user/userType'])
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const emit = defineEmits<{
  (e: 'switchModeError', message: string): void
  (e: 'switchedMode'): void
}>()

const isConfirmingLeaveQueue = ref(false)

function onModeClick() {
  if (userType.value === 'volunteer' && isInQueue.value) {
    isConfirmingLeaveQueue.value = true
    return
  }
  switchMode()
}

function confirmLeaveQueue() {
  isConfirmingLeaveQueue.value = false
  switchMode()
}

function cancelLeaveQueue() {
  isConfirmingLeaveQueue.value = false
}

async function switchMode() {
  const targetMode = userType.value === 'student' ? 'volunteer' : 'student'
  const isOnDashboard = router.currentRoute.value.path === '/dashboard'
  try {
    await UserService.switchActiveRole(
      {
        $store: store,
      },
      targetMode
    )
    if (!isOnDashboard) {
      await router.push('/dashboard')
    }
    emit('switchedMode')
  } catch (err) {
    LoggerService.noticeError(
      'Failed to switch account modes via UserModeToggle',
      err
    )
    const errorMessage = `Couldn't switch to ${targetMode} mode. Try refreshing the page.`
    emit('switchModeError', errorMessage)
  }
}

const sessionStatus = computed(
  (): SessionStatus => store.getters['user/sessionStatus']
)
</script>

<template>
  <div class="mode-toggle">
    <div class="buttons-container">
      <button
        type="button"
        @click="onModeClick"
        :class="['mode-btn', { 'mode-btn--selected': 'student' === userType }]"
      >
        <div
          :class="['indicator', `${sessionStatus.class}`]"
          v-if="userType === 'student'"
        />
        Student
      </button>

      <button
        type="button"
        @click="onModeClick"
        :class="[
          'mode-btn',
          { 'mode-btn--selected': 'volunteer' === userType },
        ]"
        data-testid="mode-btn-volunteer"
      >
        <div
          :class="['indicator', `${sessionStatus.class}`]"
          v-if="userType === 'volunteer'"
        />
        Coach
      </button>
    </div>

    <div
      v-if="isConfirmingLeaveQueue"
      :class="[
        'leave-queue-confirmation',
        { 'leave-queue-confirmation--mobile': isMobileMode },
      ]"
      role="alertdialog"
      aria-labelledby="leave-queue-confirmation-message"
      data-testid="leave-queue-confirmation"
    >
      <p id="leave-queue-confirmation-message">
        Switching to Student Mode will take you out of the queue.
      </p>
      <div class="leave-queue-confirmation__buttons">
        <button
          type="button"
          class="confirmation-btn confirmation-btn--secondary"
          @click="cancelLeaveQueue"
          data-testid="leave-queue-cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="confirmation-btn confirmation-btn--primary"
          @click="confirmLeaveQueue"
          data-testid="leave-queue-confirm"
        >
          Switch
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.buttons-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 20px;
  border: 2px solid $c-border-grey;
  padding: 3px;
  min-width: 222px;

  label {
    margin: 0;
    padding: 3px;
  }
}

.mode-btn {
  display: flex;
  flex-direction: row;
  text-align: center;
  width: 50%;
  justify-content: center;
  border-radius: 20px;
  font-weight: $font-weight-medium;
  padding: 4px;
  align-items: center;
  gap: 4px;
  color: var(--secondary-text-color);

  &--selected {
    background-color: #e3f2fd;
    color: $c-information-blue;
    border: 2px solid $c-information-blue;
    font-weight: $font-weight-bold;
  }
}

.indicator {
  background: $c-success-green;
  border-radius: 50%;
  height: 10px;
  width: 10px;

  &--session,
  &--onboarding {
    background: $c-warning-orange;
  }

  &--banned {
    background-color: $c-banned-grey;
  }
}

.mode-toggle {
  position: relative;
}

.leave-queue-confirmation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  max-width: 300px;
  margin-inline: auto;
  padding: 8px 12px;
  background-color: white;
  border: 2px solid $c-border-grey;
  border-radius: 12px;
  box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);

  .s2v & {
    background-color: var(--bg-color);
  }

  p {
    margin: 0 0 8px;
    font-size: 14px;
    line-height: 1.3;
  }

  &__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  &--mobile {
    max-width: none;
    padding: 16px;
    border-radius: 16px;

    p {
      @include font-category('body');
      margin-bottom: 16px;
    }

    .leave-queue-confirmation__buttons {
      gap: 12px;
    }

    .confirmation-btn {
      @include font-category('button');
      flex: 1;
      min-height: 44px;
    }
  }
}

.confirmation-btn {
  padding: 4px 12px;
  border-radius: $radius-lg;
  font-size: 14px;
  font-weight: $font-weight-medium;

  &--secondary {
    color: var(--secondary-text-color);
    border: 1px solid $c-border-grey;
  }

  &--primary {
    color: white;
    background-color: $c-information-blue;
  }
}
</style>
