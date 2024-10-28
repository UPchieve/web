<script setup lang="ts">
import { useStore } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'
import FallIncentiveEnrollmentModal from '@/views/DashboardView/StudentDashboard/FallIncentiveEnrollmentModal.vue'
import HamburgerButton from './HamburgerButton.vue'
import { ref, computed } from 'vue'

const store = useStore()
const showFallIncentiveEnrollmentModal = ref(false)
const productFlags = computed(() => store.state.productFlags.flags)
const mobileMode = computed(() => store.getters['app/mobileMode'])
const fallIncentiveProgramPayload = computed(
  () => store.getters['featureFlags/getFallIncentiveProgramPayload']
)
const fallIncentiveHeaderText = computed(() => {
  if (productFlags.value.fallIncentiveEnrollmentAt) {
    if (fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek === 1)
      return `You're enrolled in UPchieve's Fall Challenge! Earn $100 this fall & boost your grades`
    if (fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek > 1)
      return `You're enrolled in UPchieve's Fall Challenge! Earn $${fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek * 10} this week if you have ${fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek} sessions!`
  }

  if (fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek === 1)
    return `You're invited to earn $10 for having a session each week!`
  if (fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek > 1)
    return `You're invited to earn $${fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek * 10} this week if you have ${fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek} sessions!`
  return ''
})

const toggleFallIncentiveEnrollmentModal = () => {
  showFallIncentiveEnrollmentModal.value =
    !showFallIncentiveEnrollmentModal.value
}
</script>

<template>
  <div class="header">
    <hamburger-button v-if="mobileMode" class="left white" :tabindex="0" />
    <div class="header-message" :class="{ 'header-message-small': mobileMode }">
      <span>{{ fallIncentiveHeaderText }}</span>
    </div>
    <a
      v-if="productFlags.fallIncentiveEnrollmentAt"
      href="https://upchieve.org/upchieve-fall-challenge-2024"
      target="_blank"
      rel="noopener noreferrer"
      class="header-button"
    >
      Learn more 🎉
      <arrow-icon class="arrow-icon" />
    </a>
    <span
      @click="toggleFallIncentiveEnrollmentModal"
      class="header-button"
      v-else
    >
      Enroll now 🎉
    </span>
    <fall-incentive-enrollment-modal
      v-if="showFallIncentiveEnrollmentModal"
      :closeModal="toggleFallIncentiveEnrollmentModal"
    />
  </div>
</template>

<style lang="scss" scoped>
.header {
  @include header-child;
  display: flex;
  align-items: center;
  background-color: $c-information-blue;

  &-message {
    margin-left: auto;
    color: $upchieve-white;

    & span {
      font-weight: 500;
    }

    &-small {
      font-size: 14px;
      margin-left: 48px;
    }
  }

  &-button {
    margin-left: auto;
    color: $c-soft-black;
    background-color: $upchieve-white;
    border: none;
    border-radius: 20px;
    padding: 0.4em 1.2em;
    font-weight: 600;
    @include flex-container(row, flex-start, center);

    &:hover {
      background-color: darken($upchieve-white, 5%);
      cursor: pointer;
    }
  }
}

.arrow-icon {
  fill: currentColor;
  height: 16px;
  width: 16px;
  margin-left: 0.6em;
}

.left {
  left: 15px;
  position: absolute;
  top: 15px;
}

.white {
  fill: white;
}
</style>
