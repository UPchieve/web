<template>
  <div class="header">
    <div
      class="header-message uc-row ml-auto"
      :class="{ 'mobile-header-message': mobileMode }"
    >
      <div class="emoji">🌟</div>
      {{ studentsBecomeVolunteersCopy }}
      <div class="emoji">📚</div>
    </div>
    <LargeButton @click="showBecomeVolunteerModal" class="ml-auto">
      Become a tutor!
    </LargeButton>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import { useStore } from 'vuex'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
const store = useStore()

const showBecomeVolunteerModal = () => {
  store.dispatch('app/modal/show', {
    component: 'BecomeAVolunteerModal',
    data: {
      showTemplateButtons: false,
    },
  })
}

const studentsBecomeVolunteersCopy = computed(
  () => store.getters['featureFlags/studentsBecomeVolunteersCopy']
)
const mobileMode = computed(() => store.getters['app/mobileMode'])
onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.ROLE_SWITCHING_USER_SAW_BANNER)
})
</script>

<style lang="scss" scoped>
.header {
  @include header-child;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: $c-information-blue;

  .header-message {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: $upchieve-white;
    font-weight: 500;
  }

  .mobile-header-message {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: $upchieve-white;
    font-weight: 500;
    font-size: 14px;
  }

  .emoji {
    font-size: 22px;
  }
}
</style>
