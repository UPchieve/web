<script setup lang="ts">
import { useStore } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'
import { ref, computed, defineAsyncComponent } from 'vue'

const FallIncentiveEnrollmentModal = defineAsyncComponent(
  () =>
    import('@/views/DashboardView/StudentDashboard/FallIncentiveEnrollmentModal.vue')
)
const store = useStore()
const showFallIncentiveEnrollmentModal = ref(false)
const user = computed(() => store.state.user.user)
const productFlags = computed(() => store.state.productFlags.flags)
const mobileMode = computed(() => store.getters['app/mobileMode'])
const fallIncentiveProgramPayload = computed(
  () => store.getters['featureFlags/getFallIncentiveProgramPayload']
)
const isIncentiveBannerEnabled = computed(
  () => store.getters['featureFlags/isIncentiveBannerEnabled']
)
const incentiveBannerPayload = computed(
  () => store.getters['featureFlags/getIncentiveBannerPayload']
)
const isHidingButtons = isIncentiveBannerEnabled.value

const fallIncentiveHeaderText = computed(() => {
  if (isIncentiveBannerEnabled.value) {
    return incentiveBannerPayload.value.replace(
      '{{schoolName}}',
      user.value.schoolName
    )
  }

  if (productFlags.value.fallIncentiveEnrollmentAt) {
    if (user.value.isSchoolPartner)
      return `Earn $10, complete 5 sessions by February 28th!`
    if (fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek === 1)
      return `You're enrolled in UPchieve's Fall Challenge! Earn $100 this fall & boost your grades`
    if (fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek > 1)
      return `You're enrolled in UPchieve's Fall Challenge! Earn $${fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek * 10} this week if you have ${fallIncentiveProgramPayload.value.maxQualifiedSessionsPerWeek} sessions!`
  }

  if (user.value.isSchoolPartner)
    return `You're invited to earn $10 for completing 5 sessions by February 28th!`
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
    <div
      class="header-message"
      :class="{
        'header-message-small': mobileMode,
        'header-message--hidden-buttons': isHidingButtons,
      }"
    >
      <span>{{ fallIncentiveHeaderText }}</span>
    </div>
    <template v-if="!isHidingButtons">
      <a
        v-if="productFlags.fallIncentiveEnrollmentAt"
        href="https://upchieve.org/upchieve-10-challenge-2025"
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
    </template>
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

    &--hidden-buttons {
      margin: 0 auto;
      text-align: center;
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
</style>
