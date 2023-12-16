<template>
  <div id="verification-header">
    <hamburger-button v-if="mobileMode" class="left white" :tabindex="0" />
    <span id="header-message"
      >Your account {{ verificationMethodText }} is unverified.
    </span>
    <LargeButton
      id="verify-button"
      primary
      @click.native="openVerificationModal"
      >Verify now!</LargeButton
    >
    <VerificationModal
      v-if="showVerificationModal"
      :close-modal="onModalClosed"
      :verification-method="headerData.verificationMethod"
      :phone-or-email-to-verify="headerData.phoneOrEmailToVerify"
      :on-close-success="hideHeader"
    />
  </div>
</template>

<script>
import LargeButton from '@/components/LargeButton.vue'
import VerificationModal from '@/views/VerificationModal.vue'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import { mapGetters, mapState } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import HamburgerButton from '@/components/App/AppHeader/HamburgerButton.vue'

export default {
  name: 'VerificationHeader',
  props: {
    headerData: {
      type: Object,
      required: true,
    },
  },
  computed: {
    VERIFICATION_METHOD() {
      return VERIFICATION_METHOD
    },
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    verificationMethodText() {
      return this.headerData.verificationMethod === VERIFICATION_METHOD.SMS
        ? 'phone number'
        : 'email address'
    },
  },
  components: { VerificationModal, LargeButton, HamburgerButton },
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
    async hideHeader() {
      await this.$store.dispatch('app/header/hide')
    },
  },
}
</script>

<style lang="scss" scoped>
#verification-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: $c-warning-orange;
  gap: 24px;

  #header-message {
    color: $upchieve-white;
    margin-left: auto;
    font-weight: 500;
  }

  @include header-child;
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

.left {
  left: 15px;
  position: absolute;
  top: 15px;
}

.white {
  fill: white;
}
</style>
