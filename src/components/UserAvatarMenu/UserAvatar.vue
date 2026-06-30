<script lang="ts" setup>
import QuestionIcon from '@/assets/question-mark-icon.svg'
import { useStore } from 'vuex'
import { computed } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import Case from 'case'

const store = useStore()

const props = withDefaults(
  defineProps<{
    showAccountModeLabel: boolean
    showSessionStatusLabel: boolean
    showIndicatorRing: boolean
  }>(),
  {
    showAccountModeLabel: true,
    showSessionStatusLabel: true,
    showIndicatorRing: true,
  }
)

const avatar = computed(
  (): {
    id: string
    component: any
  } => store.getters['user/avatar']
)
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const user = computed(() => store.state.user.user)
const sessionStatus = computed(() => store.getters['session/sessionStatus'])

// Ambassador logic
const showAmbassadorTitle = computed(
  () => store.getters['user/showAmbassadorTitle']
)
const isInAmbassadorProgram = computed(
  () => store.getters['user/isVolunteerProgramAmbassador']
)
const ambassadorTooltipText = computed(() => {
  return isInAmbassadorProgram.value
    ? 'You are a member of our UPchieve Ambassadors program!'
    : `You've earned UPchieve ambassador status by referring ${user.value?.numReferredVolunteers ?? '5+'} friends. Nice work!`
})

// Account type
const userAccountType = computed(() => {
  if (showAmbassadorTitle.value) {
    AnalyticsService.captureEvent(EVENTS.AMBASSADOR_SAW_AMBASSADOR_TITLE)
    return 'Volunteer Ambassador'
  }
  return Case.capital(store.getters['user/userType']) + ' Account'
})
</script>

<template>
  <div class="user-avatar-container">
    <div
      class="avatar-container"
      :class="{ 'avatar-container--indicator-ring': props.showIndicatorRing }"
    >
      <component :is="avatar?.component" class="avatar" aria-hidden="true" />
      <div
        v-if="props.showIndicatorRing"
        class="indicator-container"
        :aria-label="sessionStatus?.text"
      >
        <div class="indicator" :class="sessionStatus?.class" />
      </div>
    </div>
    <div class="core-info-container">
      <span class="first-name">{{ user.firstName }}</span>
      <div v-if="props.showAccountModeLabel">
        <span class="secondary-info">{{ userAccountType }}</span>
        <QuestionIcon
          v-if="showAmbassadorTitle"
          class="ambassador-tooltip-icon"
          id="ambassador-tooltip-icon"
          @click.stop
        />
        <ion-popover
          alignment="center"
          :showBackdrop="false"
          trigger="ambassador-tooltip-icon"
          trigger-action="click"
        >
          {{ ambassadorTooltipText }}
        </ion-popover>
      </div>
      <div v-if="props.showSessionStatusLabel">
        <div
          class="status-container"
          :class="{
            'status-container-mobile': isMobileMode,
          }"
        >
          <div
            :class="[
              'indicator',
              sessionStatus?.class,
              { 'indicator--mobile': isMobileMode },
            ]"
          />
          <span class="secondary-info">
            {{ sessionStatus?.text }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-avatar-container {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  padding: 4px 0px 4px 8px;
}

.avatar-container {
  @include flex-container(column, center, center);
  border-radius: 50%;
  height: 55px;
  position: relative;
  width: 55px;
  flex-shrink: 0;
  grid-row: 1;
  grid-column: avatar;

  &--indicator-ring {
    border: 2px solid #d8dee5;
  }
}

.avatar {
  height: 45px;
  width: 45px;
}

.indicator-container {
  @include flex-container(column, center, center);
  background: white;
  border-radius: 50%;
  bottom: 0px;
  height: 15px;
  position: absolute;
  right: 1px;
  width: 15px;
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

  &--mobile {
    margin-right: 8px;
  }
}

.core-info-container {
  display: flex;
  flex-direction: column;
  grid-row: 1;
  grid-column: details;
  justify-content: center;
}

.first-name {
  @include font-category(subheading);
  color: var(--secondary-text-color);
  margin-top: 4px;
  margin-bottom: 0px;
}

.status-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.status-container-mobile {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0px;
}

.ambassador-tooltip-icon {
  height: 15px;
  width: 15px;
  margin-left: 4px;
  vertical-align: middle;
  display: inline-block;

  &:hover {
    cursor: pointer;
  }
}

ion-popover::part(content) {
  border-radius: 10px;
  padding: 8px;
  text-align: center;
}

.secondary-info {
  color: var(--secondary-text-color);
  font-size: 14px;
  line-height: 1.15;
  margin-bottom: 0;
  white-space: nowrap;
}
</style>
