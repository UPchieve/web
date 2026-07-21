<script setup lang="ts">
import StudyImgFallback from '@/assets/study.png?url'
import StudyImg from '@/assets/study.avif?url'
import BubbleSvg from '@/assets/bubble.svg'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '../services/AnalyticsService'
import UserService from '../services/UserService'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, onMounted } from 'vue'

const store = useStore()
const router = useRouter()
const user = computed(() => store.state.user.user)
const hasVolunteerRole = computed(() => store.getters['user/hasVolunteerRole'])
onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.BECOME_VOLUNTEER_AD_SEEN)
})
const becomeAVolunteer = async () => {
  AnalyticsService.captureEvent(EVENTS.BECOME_VOLUNTEER_AD_CLICKED)
  try {
    await UserService.firstTransitionToVolunteerMode(router)
  } catch (e) {
    LoggerService.noticeError(
      e,
      `Failed to add or switch active role for user: ${user.value.id}`
    )
  }
}
const switchRole = async () => {
  try {
    await UserService.switchActiveRole({ $store: store }, 'volunteer')
    await router.replace('/dashboard')
  } catch (err) {
    LoggerService.noticeError(
      (err instanceof Error ? err.message : null) ??
        'Error while switching account modes',
      { userId: user.value.id }
    )
  }
}
</script>

<template>
  <div class="ad">
    <div class="copy">
      <span class="title">Earn Service Hours</span>
      <p>
        Did you know you could earn service hours by volunteering on UPchieve?
      </p>
      <p>✅ 100% flexible schedule</p>
      <p>✅ No experience required</p>
      <p>
        Choose over 30+ subjects to tutor including 6th Grade Math, Reading,
        Middle School Science, and more! Earn verified service hours and make a
        real impact in your downtime.
      </p>
      <LargeButton
        v-if="hasVolunteerRole"
        class="cta"
        variant="primary-blue"
        :show-arrow="false"
        @click="switchRole"
      >
        Switch to Volunteer View
      </LargeButton>
      <LargeButton
        v-else
        variant="primary-blue"
        :show-arrow="false"
        @click="becomeAVolunteer"
        >Get Started</LargeButton
      >
    </div>
    <div class="image">
      <picture>
        <source :srcset="StudyImg" />
        <img class="img" :src="StudyImgFallback" />
      </picture>
      <div class="bubble">
        <BubbleSvg />
        <span class="bubble-text">Good luck on your quiz! You got this 🎉</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ad {
  display: grid;
  grid-template-columns: 50% 50%;
  max-width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.04);
  position: relative;
  @include breakpoint-below('large') {
    grid-template-columns: 100%;
  }
}
.image {
  position: relative;
}
.copy {
  background-color: white;
  padding: 20px 12px 20px 32px;
  color: var(--Grey-scale-Soft-Black, #343440);
}

.title {
  font-size: 32px;
  font-weight: 500;
  line-height: 125%;
}

.bubble {
  position: absolute;
  right: 32px;
  top: 18%;
  z-index: 1;
  :deep(svg) {
    overflow: visible;
  }
}

.bubble-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: start;
  padding-top: 12px;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.img {
  padding: 20px 32px 0 0;
  object-fit: cover;
  height: 100%;
  width: 100%;
  background-color: #f2fbf9;
}
</style>
