<script setup lang="ts">
import { dayjs } from '@/utils/time-utils'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import RewardsIcon from '@/assets/rewards-icon.svg'
import Caret from '@/assets/right-caret.svg'
import { EVENTS } from '@/consts'
import LargeButton from '@/components/LargeButton.vue'
import Loader from '@/components/Loader.vue'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import { useStepper } from '@/composables/useStepper'
import NetworkService from '@/services/NetworkService'

type UserReward = {
  id: string
  rewardLink: string
  amount: number
  status: string
  campaignId: string
  campaignName: string
  createdAt: Date
}

const userRewards = ref<UserReward[]>([])
const totalRewardsCount = ref(0)
const isLoading = ref(false)
const totalSteps = ref(1)
const itemsPerPage = ref(4)
const earnedRewardsError = ref('')

const { currentStep, isFirstStep, isLastStep, nextStep, prevStep } =
  useStepper(totalSteps)

const itemsToShow = computed(() => {
  const startIndex = (currentStep.value - 1) * itemsPerPage.value
  return userRewards.value.slice(startIndex, startIndex + itemsPerPage.value)
})

function updateItemsPerPage() {
  itemsPerPage.value = window.innerWidth < 1000 ? 2 : 4
  totalSteps.value = Math.max(
    1,
    Math.ceil(totalRewardsCount.value / itemsPerPage.value)
  )
  if (currentStep.value > totalSteps.value) currentStep.value = totalSteps.value
  if (currentStep.value < 1) currentStep.value = 1
}

async function handleRewardClick(rewardLink: string) {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_REDEEM_AWARD)
  window.open(rewardLink, '_blank')
}

async function handleNextPage() {
  if (isLoading.value || isLastStep.value) return
  isLoading.value = true

  const nextStepIndex = currentStep.value + 1
  const startIndex = (nextStepIndex - 1) * itemsPerPage.value

  if (
    startIndex >= userRewards.value.length &&
    userRewards.value.length < totalRewardsCount.value
  ) {
    try {
      const response = await NetworkService.getUserRewards(
        userRewards.value.length
      )
      if (!response.data) return
      const { rewards: newRewards, total } = response.data

      if (newRewards?.length) {
        userRewards.value.push(...newRewards)
        totalRewardsCount.value = total
        totalSteps.value = Math.ceil(
          totalRewardsCount.value / itemsPerPage.value
        )
      }
    } catch (error) {
      LoggerService.noticeError(error)
      earnedRewardsError.value =
        'Unable to load your rewards. Please try refreshing.'
    } finally {
      isLoading.value = false
    }
  }

  if (currentStep.value < totalSteps.value) nextStep()
}

function handlePrevPage() {
  if (!isFirstStep.value) prevStep()
}

watch(itemsPerPage, (newItemsPerPage, oldItemsPerPage) => {
  if (newItemsPerPage !== oldItemsPerPage) {
    const firstVisibleItemIndex = (currentStep.value - 1) * oldItemsPerPage
    const newPageIndex = Math.floor(firstVisibleItemIndex / newItemsPerPage) + 1
    currentStep.value = Math.max(1, Math.min(newPageIndex, totalSteps.value))
  }
})

onMounted(async () => {
  try {
    isLoading.value = true
    const response = await NetworkService.getUserRewards(0)
    if (!response.data) return
    const { rewards, total } = response.data

    userRewards.value = rewards
    totalRewardsCount.value = total
    totalSteps.value = Math.ceil(totalRewardsCount.value / itemsPerPage.value)

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)

    isLoading.value = false
  } catch (error) {
    LoggerService.noticeError(error)
    earnedRewardsError.value =
      'Unable to load your rewards. Please try refreshing.'
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateItemsPerPage)
})
</script>

<template>
  <div class="rewards-container">
    <header>
      <h1 class="header__title">Rewards</h1>
      <p class="header__subtitle">
        Complete surveys and redeem awesome gift cards!
      </p>
    </header>

    <section>
      <header class="rewards-header">
        <h2 class="rewards-title">Earned Rewards</h2>
        <div class="rewards-controls">
          <span
            class="page-control"
            :class="isFirstStep && 'page-control--disabled'"
            @click="handlePrevPage"
          >
            <Caret class="caret" style="transform: rotate(180deg)" />
          </span>
          <span
            class="page-control"
            :class="isLastStep && 'page-control--disabled'"
            @click="handleNextPage"
          >
            <Caret class="caret" />
          </span>
        </div>
      </header>

      <Loader v-if="isLoading" class="rewards-loader" />
      <p v-else-if="earnedRewardsError" class="error">
        {{ earnedRewardsError }}
      </p>
      <p v-else-if="itemsToShow.length === 0">
        You currently do not have any rewards gifted to you.
      </p>
      <div v-else class="rewards-list">
        <div v-for="reward in itemsToShow" :key="reward.id" class="reward-item">
          <div class="reward-icon-container">
            <RewardsIcon class="reward-icon" />
          </div>

          <span class="reward-item__date">
            {{ dayjs(reward.createdAt).format('MM/DD/YYYY') }}
          </span>

          <p class="reward-item__campaign">{{ reward.campaignName }}</p>
          <span class="reward-item__amount">${{ reward.amount }}</span>

          <LargeButton
            variant="primary"
            @click="handleRewardClick(reward.rewardLink)"
            class="reward-item__redeem-button"
            :showArrow="false"
            :disabled="!reward.rewardLink"
          >
            Redeem
          </LargeButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.rewards {
  &-container {
    margin-left: 2em;
    margin-top: 2em;
    max-width: 1500px;
  }

  &-title {
    font-size: 20px;
    margin-bottom: 0;
  }

  &-list {
    @include flex-container(row);
    margin-top: 1em;
  }

  &-controls {
    @include flex-container(row, space-between, center);
    width: 100px;
    margin-right: 1em;
  }

  &-header {
    @include flex-container(row, space-between, center);
  }

  &-loader {
    @include flex-container(row, center);
  }
}

.reward-icon {
  width: 100%;
  &-container {
    background-color: #ffeebe;
    border-radius: 10px;
    padding: 2em;
    margin: 0.2em;
  }
}

.header {
  &__title {
    @include font-category('display-small');
  }
  &__subtitle {
    @include font-category('body');
    color: $c-secondary-grey;
  }
}

.reward-item {
  flex-basis: 30%;
  margin-right: 1.2em;
  padding: 0.4em;
  background-color: $upchieve-white;
  border-radius: 20px;
  max-width: 300px;

  &__date {
    font-size: 12px;
    color: $c-secondary-grey;
    font-weight: 500;
  }

  &__campaign {
    font-size: 14px;
    margin-bottom: 0;
    font-weight: 500;
  }

  &__amount {
    font-size: 14px;
    font-weight: 500;
  }

  &__redeem-button {
    display: block;
    width: 100%;
    border-radius: 0.4em;
    background-color: $c-information-blue;
    margin: 0.4em 0;
    &:hover {
      cursor: pointer;
      background-color: darken($c-information-blue, 10%);
    }
  }
}

.page-control {
  @include flex-container(row, center, center);
  border-radius: 100%;
  border: 1px solid $c-border-grey;
  width: 40px;
  height: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: $upchieve-white;

  &:hover {
    cursor: pointer;
    background-color: $c-background-grey;
  }

  &--disabled {
    visibility: hidden;
  }
}

.caret {
  height: 100%;
  color: $c-secondary-grey;
  stroke-width: 1.4px;
}

.error {
  color: $c-error-red;
}

@media (max-width: 1000px) {
  .reward-item {
    flex-basis: 50%;
  }
}
</style>
