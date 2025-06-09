<script lang="ts" setup>
import ReferralLink from '@/components/ReferralLink.vue'
import AmbassadorIcon from '@/assets/user_avatars/ambassador-icon.svg'
import CrossIcon from '@/assets/cross.svg'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import { onMounted } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const store = useStore()
const closeModal = () => {
  store.dispatch('app/modal/hide')
}

const onCopiedReferralLink = () => {
  AnalyticsService.captureEvent(EVENTS.AMBASSADOR_REFERRAL_CLICKED_COPY)
}

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.AMBASSADOR_REFERRAL_SAW_MODAL)
})
</script>

<template>
  <div class="referral-modal">
    <button class="x-button" @click="closeModal">
      <CrossIcon class="x-icon" />
    </button>
    <ambassador-icon class="icon" />
    <h1 class="referral-modal-title">Become an UPchieve Ambassador!</h1>
    <p>
      Did you know you can earn volunteer hours by recruiting new tutors for
      UPchieve? Just share your <strong>unique signup link</strong> with your
      friends, family, and colleagues:

      <referral-link @copied="onCopiedReferralLink" />

      Get 5 signups to earn 1 volunteer hour and become an official UPchieve
      Ambassador-- <strong>great for resumés and college apps!</strong> 🎉
    </p>
    <LargeButton
      variant="primary"
      :showArrow="false"
      class="close-modal-button"
      @click="closeModal"
      >Got it!</LargeButton
    >
  </div>
</template>

<style lang="scss" scoped>
.referral-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.x-button {
  margin-left: auto;

  .x-icon {
    height: 20px;
    width: 20px;
  }
}

.referral-modal-title {
  @include font-category('heading');
  padding-top: 16px;
}

.icon {
  height: fit-content;
  width: 40%;
}

.close-modal-button {
  margin-left: auto;
  width: 100%;
  margin-top: 8px;
}
</style>
