<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import UserService from '@/services/UserService'
import LoggerService from '@/services/LoggerService'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const userType = computed(() => store.getters['user/userType'])
const emit = defineEmits<{
  (e: 'switchModeError', message: string): void
  (e: 'switchedMode'): void
}>()
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
    const errorMessage = `Couldn't switch to to ${targetMode} mode. Try refreshing the page.`
    emit('switchModeError', errorMessage)
  }
}

const sessionStatus = computed(
  (): {
    class: string
  } => store.getters['session/sessionStatus']
)
</script>

<template>
  <div class="buttons-container">
    <button
      type="button"
      @click="switchMode"
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
      @click="switchMode"
      :class="['mode-btn', { 'mode-btn--selected': 'volunteer' === userType }]"
    >
      <div
        :class="['indicator', `${sessionStatus.class}`]"
        v-if="userType === 'volunteer'"
      />
      Coach
    </button>
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
</style>
