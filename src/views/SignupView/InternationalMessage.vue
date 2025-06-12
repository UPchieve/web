<script setup lang="ts">
import LargeButton from '@/components/LargeButton.vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import International from '@/assets/international.svg'

/* THIS COMPONENT IS PART OF AN EXPERIMENT */

const handleClick = () => {
  AnalyticsService.captureEvent(EVENTS.USER_CLICKED_VOLUNTEER_SIGN_UP)
}
</script>

<template>
  <div class="container uc-column justify-center items-center">
    <International />
    <div class="header uc-column">
      <span class="title">UPchieve isn’t available in your region yet</span>
      We currently only serve students in the U.S.
    </div>
    <div class="explainer">
      <span class="bold"
        >Want to make a difference for others—and boost your college
        application?</span
      >
      You can still get involved by volunteering as a tutor, no matter where you
      live! No experience is required, and you can choose your own hours.
    </div>
    <LargeButton
      variant="primary-blue"
      :showArrow="false"
      @click="handleClick"
      routeTo="/sign-up/volunteer/account"
    >
      Volunteer with UPchieve
    </LargeButton>
    <div class="footer">
      If you live in the U.S. and are seeing this message, please check that
      you’re not using a VPN. Still need help?
      <router-link to="/contact" class="uc-link">Contact Us</router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  gap: 24px;
}

.header {
  font-size: 20px;
  font-weight: 500;
  line-height: 160%;
  text-align: center;
}

.title {
  font-size: 26px;
}

.explainer {
  font-size: 14.5px;
  line-height: 1.5;
  background-color: rgb(199 244 235);
  text-align: left;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
}

.footer {
  font-size: 14px;
  text-align: center;
}

.bold {
  font-weight: 500;
}
</style>
