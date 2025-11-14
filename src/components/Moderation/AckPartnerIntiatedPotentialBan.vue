<template>
  <Modal
    v-if="didPartnerAckLiveMediaBan"
    class="moderation-infraction-info-modal upc-modal"
  >
    <div class="header">
      <UnlockIcon class="unlock-icon" />
      <h1>
        {{ `${upperCasePartner} Removed Live Media Ban` }}
      </h1>
    </div>

    <br />
    <div class="infraction-modal-body">
      <p>You're good to go! Start your screen share again when you're ready.</p>

      <div class="confirmation-buttons">
        <LargeButton @click="acknowledge" :show-arrow="false" variant="primary"
          >Close</LargeButton
        >
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { capitalize } from 'lodash-es'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import UnlockIcon from '@/assets/unlock.svg'

const store = useStore()

const partner = store.getters['user/isStudent'] ? 'coach' : 'student'
const upperCasePartner = capitalize(partner)

const didPartnerAckLiveMediaBan = computed(
  () => store.state.liveMedia.partnerAckLiveMediaBan != null
)

const acknowledge = function () {
  store.commit('liveMedia/setPartnerAckLiveMediaBan', null)
}
</script>

<style lang="scss" scoped>
.moderation-infraction-info-modal {
  display: flex;
  flex-direction: column;
  justify-content: center;

  .infraction-modal-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 0;
  }

  .confirmation-buttons {
    display: flex;
    justify-content: center;
    column-gap: 8rem;
  }
  h1 {
    font-size: 1.5rem;
  }

  .unlock-icon {
    height: 2.1rem;
    width: 2rem;
  }

  .header {
    display: flex;
    column-gap: 8px;
  }
}
</style>
