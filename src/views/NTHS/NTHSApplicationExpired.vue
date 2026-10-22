<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useStore } from 'vuex'
import NTHSPageLayout from '@/components/NTHS/NTHSPageLayout.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
const AmbassadorReferralModal = defineAsyncComponent(
  () => import('@/views/AmbassadorReferralModal.vue')
)

const store = useStore()
const firstName = computed(() => store.getters['user/firstName'])
const ambassadorReferralModalIsOpen = ref(false)

function closeAmbassadorReferralModal() {
  AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLOSE)
  ambassadorReferralModalIsOpen.value = false
}
</script>

<template>
  <NTHSPageLayout>
    <p>
      Hey {{ firstName }}, uh-oh! Looks like you didn't create your NTHS chapter
      within 30 days.
    </p>

    <p>
      No worries if you got too busy. You can still earn volunteer hours and
      certifications as an UPchieve coach. Plus, you can become an UPchieve
      <a
        class="uc-link"
        href="#"
        v-ph:nths="'application_expired.ambassador'"
        @click.prevent="ambassadorReferralModalIsOpen = true"
        >ambassador</a
      >
      without having to run a whole chapter.
    </p>

    <p>
      Still want to lead? Email us at
      <a href="mailto:nths@upchieve.org" v-ph:nths="'application_expired.email'"
        >nths@upchieve.org</a
      >
      to get help.
    </p>

    <AmbassadorReferralModal
      v-if="ambassadorReferralModalIsOpen"
      :closeModal="closeAmbassadorReferralModal"
    />
  </NTHSPageLayout>
</template>
