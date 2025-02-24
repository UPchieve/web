<template>
  <div id="verification-header">
    <span id="header-message"
      >Your account {{ verificationMethodText }} is unverified.
    </span>
    <LargeButton id="verify-button" primary @click="openVerificationModal"
      >Verify now!</LargeButton
    >
    <VerificationModal
      v-if="showVerificationModal"
      :close-modal="onModalClosed"
      :verification-method="verificationMethod"
      :phone-or-email-to-verify="user.email"
    />
  </div>
</template>

<script>
import LargeButton from '@/components/LargeButton.vue'
import VerificationModal from '@/views/VerificationModal.vue'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import { mapState } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  name: 'VerificationHeader',
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    verificationMethod() {
      return VERIFICATION_METHOD.EMAIL
    },
    verificationMethodText() {
      return 'email address'
    },
  },
  components: { VerificationModal, LargeButton },
  data() {
    return {
      showVerificationModal: false,
    }
  },
  methods: {
    openVerificationModal() {
      this.showVerificationModal = true
      AnalyticsService.captureEvent(EVENTS.VERIFICATION_HEADER_CLICKED, {
        verificationMethod: this.headerData.verificationMethod,
        userId: this.user.id,
      })
    },
    onModalClosed() {
      this.showVerificationModal = false
    },
  },
}
</script>

<style lang="scss" scoped>
#verification-header {
  @include header-child;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: $c-warning-orange;

  #header-message {
    color: $upchieve-white;
    margin-left: auto;
    font-weight: 500;
  }
}

#verify-button {
  color: $c-soft-black;

  margin-left: auto;
  background-color: $upchieve-white;
  border: none;
  border-radius: 20px;
  padding: 0.4em 1.2em;
  font-weight: 600;

  &:hover {
    background-color: darken($upchieve-white, 5%);
  }
}
</style>
