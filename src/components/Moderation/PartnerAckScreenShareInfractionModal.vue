<template>
  <Modal
    v-if="hasPotentialPartnerInfraction"
    class="moderation-infraction-info-modal upc-modal"
  >
    <div class="header">
      <Warning class="warning-icon" src="@/assets/warning_icon.svg" />
      <h1>
        Potential
        {{ upperCasePartner }}
        Moderation Violation
      </h1>
    </div>

    <br />
    <div class="infraction-modal-body">
      <p>
        For everyone's safety, we've banned the {{ partner }} from using their
        microphone and screen share features because a person appeared in the
        screen share.
      </p>
      <p>
        Do you think the
        {{ partner }} shared anything that might go against
        <b>Upchieve’s</b> Personally Identifiable Information (PII)&nbsp;<Link
          :url="policyLink"
          text="policies"
          target="_blank"
        />?
      </p>

      <div class="confirmation-buttons">
        <LargeButton @click="removeBan" :show-arrow="false" variant="secondary"
          >Remove Ban</LargeButton
        >
        <LargeButton @click="banPartner" :show-arrow="false" variant="primary"
          >Report Concern</LargeButton
        >
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { toastController } from '@ionic/vue'
import { closeCircleOutline } from 'ionicons/icons'
import { useStore } from 'vuex'
import { capitalize } from 'lodash-es'
import { socket } from '@/socket'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import Link from '@/components/Link.vue'
import LoggerService from '@/services/LoggerService'
import Warning from '@/assets/warning.svg'

const store = useStore()

const partner = store.getters['user/isStudent'] ? 'coach' : 'student'

const policyLink = store.getters['user/isStudent']
  ? 'https://help.upchieve.org/en/articles/24-coach-community-guidelines'
  : 'https://help.upchieve.org/en/articles/25-student-community-guidelines'

const upperCasePartner = capitalize(partner)
const hasPotentialPartnerInfraction = computed(
  () => store.state.liveMedia.potentialPartnerInfraction != null
)

const banPartner = () => {
  handlePotentialViolation(false)
}

const removeBan = () => {
  handlePotentialViolation(true)
}

const handlePotentialViolation = async (wasBanMistake: boolean) => {
  try {
    if (wasBanMistake) {
      socket.emit('removePartnerLiveMediaBan')
    }

    store.commit('liveMedia/setPotentialPartnerInfraction', null)

    const message = wasBanMistake
      ? `Thanks for letting us know! Let the ${partner} know they can screen share again.`
      : `Thanks for letting us know! The ${partner} is banned from screen sharing.`
    const toast = await toastController.create({
      message,
      color: 'dark',
      position: 'middle',
      animated: true,
      duration: 5000,
      swipeGesture: 'vertical',
      buttons: [
        {
          icon: closeCircleOutline,
          role: 'cancel',
        },
      ],
    })
    await toast.present()
  } catch (err) {
    LoggerService.noticeError(
      err,
      'Could not update session and user after potential moderation violation'
    )
  }
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
    display: inline-block;
  }

  .warning-icon {
    height: 2.1rem;
    width: 2.2rem;
  }

  .header {
    display: flex;
    column-gap: 8px;
  }
}
</style>
