<template>
  <Modal :closeModal="closeModal">
    <Loader v-if="isSubmitting" :message="loadingMessage" overlay />
    <!-- Step 1 content: Need to complete verification -->
    <div v-if="!verificationComplete">
      <div v-show="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      <div v-if="!flowIncompletable" data-testid="verification-body">
        <p
          class="uc-form-text"
          data-testid="phone-or-email-changed-message"
          v-if="phoneOrEmailToVerify !== phoneOrEmail"
        >
          Before we can save your new {{ verificationMethodText }}, we need to
          verify it.
        </p>
        <p class="uc-form-text">
          We just sent a verification code to
          <span class="verification-destination">{{
            phoneOrEmailToVerify
          }}</span
          >.
        </p>
        <div class="uc-form-element">
          <label for="verification-code-field">
            Enter your 6-digit verification code
          </label>
          <input
            class="uc-form-text-input"
            id="verification-code-field"
            v-model="verificationCode"
            type="text"
            placeholder="XXXXXX"
            maxlength="6"
          />
        </div>
        <p class="uc-form-subtext">
          Did not receive a code?
          <span
            class="uc-link secondary-btn"
            :disabled="isSubmitting"
            @click.prevent="resendCode"
            id="resend-btn"
          >
            Resend code
          </span>
        </p>

        <div class="buttons-container">
          <button
            type="submit"
            :disabled="!isValidVerificationCode"
            class="uc-form-button"
            data-testid="verify-code-btn"
            @click.prevent="confirmVerification"
          >
            Verify my {{ verificationMethodText }}
          </button>
          <button
            class="uc-form-button-secondary"
            id="cancel-btn"
            @click="closeModal"
          >
            Cancel
          </button>
        </div>
        <RecaptchaCaption />
      </div>
      <button
        v-if="flowIncompletable"
        class="uc-form-button-secondary"
        id="cancel-btn"
        @click="closeModal"
      >
        Go Back
      </button>
    </div>

    <!-- Step 2 content: Completed state -->
    <div v-if="verificationComplete">
      <p class="uc-form-text">
        Your {{ verificationMethodText }} has been verified!
      </p>
      <button class="uc-form-button" @click="completeModal">Close</button>
    </div>
  </Modal>
</template>
<script>
import Loader from '@/components/Loader.vue'
import Modal from '@/components/Modal.vue'
import { VERIFICATION_METHOD } from '@/consts'
import AuthService from '@/services/AuthService'
import { mapState } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import RecaptchaCaption from '@/components/recaptcha/RecaptchaCaption.vue'

export default {
  name: 'verification-modal',
  components: {
    RecaptchaCaption,
    Modal,
    Loader,
  },
  props: {
    phoneOrEmailToVerify: {
      type: String,
      required: true,
    },
    verificationMethod: {
      type: String,
      required: true,
    },
    closeModal: {
      type: Function,
      required: true,
    },
    onCloseSuccess: {
      type: Function,
      required: false,
    },
  },
  data() {
    return {
      verificationCode: '',
      isSubmitting: false,
      error: '',
      loadingMessage: '',
      loadingMessageCodeSent: 'Sending a verification code. Please wait...',
      loadingMessageCodeVerifying: 'Verifying your code. Please wait...',
      phoneOrEmail: '',
      verificationComplete: false,
      defaultErrorMessage: 'Something went wrong',
      flowIncompletable: false,
      verificationMethodText:
        this.verificationMethod === VERIFICATION_METHOD.SMS
          ? 'phone number'
          : 'email',
    }
  },
  mounted() {
    this.initiateVerification()
    AnalyticsService.captureEvent(EVENTS.VERIFICATION_MODAL_OPENED, {
      verificationMethod: this.verificationMethod,
      userId: this.user.id,
    })
  },
  created() {
    this.phoneOrEmail =
      this.verificationMethod === VERIFICATION_METHOD.SMS
        ? this.user.phone
        : this.user.email
  },
  computed: {
    VERIFICATION_METHOD() {
      return VERIFICATION_METHOD
    },
    ...mapState({
      user: state => state.user.user,
    }),
    isValidVerificationCode() {
      return !(
        this.verificationCode.length !== 6 ||
        isNaN(Number(this.verificationCode))
      )
    },
  },
  methods: {
    async initiateVerification() {
      this.loadingMessage = this.loadingMessageCodeSent
      this.isSubmitting = true
      this.error = ''

      try {
        await AuthService.initiateVerification({
          sendTo: this.phoneOrEmailToVerify,
          verificationMethod: this.verificationMethod,
          firstName: this.user.firstName,
          userId: this.user.id,
        })
      } catch (error) {
        // 4xx errors: User has done something wrong, which is either to do with the phone number/email
        // or making too many requests.
        // 5xx: Something is malfunctioning.
        // In either case, there is nothing to do but close the modal.
        this.flowIncompletable = true
        this.displayError(error)
      }

      this.isSubmitting = false
    },

    /**
     * Calls /verify/confirm and emits events if successful.
     * @returns {Promise<void>}
     */
    async confirmVerification() {
      this.loadingMessage = this.loadingMessageCodeVerifying
      this.isSubmitting = true
      this.error = ''
      try {
        const result = await AuthService.confirmVerification({
          verificationCode: this.verificationCode,
          sendTo: this.phoneOrEmailToVerify,
          verificationMethod: this.verificationMethod,
          forSignup: false,
          userId: this.user.id,
        })
        if (result.data.success) {
          this.verificationComplete = true
          if (this.verificationMethod === VERIFICATION_METHOD.SMS) {
            AnalyticsService.captureEvent(EVENTS.PHONE_NUMBER_VERIFIED)

            if (this.user.phone !== this.phoneOrEmailToVerify) {
              AnalyticsService.captureEvent(EVENTS.PHONE_NUMBER_UPDATED)
            }
          } else {
            AnalyticsService.captureEvent(EVENTS.EMAIL_VERIFIED)
            if (this.user.email !== this.phoneOrEmailToVerify) {
              AnalyticsService.captureEvent(EVENTS.EMAIL_UPDATED)
            }
          }
          this.error = ''
        } else {
          this.error =
            'Please enter the most recent verification code that was sent to you'
        }
      } catch (error) {
        this.displayError(error)
      }

      this.isSubmitting = false
    },
    async resendCode() {
      this.initiateVerification()
    },
    async completeModal() {
      this.closeModal()
      this.onCloseSuccess()
      const updates = {}
      if (this.verificationMethod === VERIFICATION_METHOD.EMAIL) {
        updates.emailVerified = true
        updates.email = this.phoneOrEmailToVerify
      } else if (this.verificationMethod === VERIFICATION_METHOD.SMS) {
        updates.phoneVerified = true
        updates.phone = this.phoneOrEmailToVerify
      }
      await this.$store.dispatch('user/addToUser', updates)
    },
    displayError(error) {
      this.error = error?.response?.data?.err ?? this.defaultErrorMessage
    },
  },
}
</script>

<style lang="scss" scoped>
.verification-destination {
  font-weight: bold;
}

.secondary-btn {
  &:hover {
    cursor: pointer;
  }
}

.uc-form-element {
  text-align: initial;
}

.uc-form-button-secondary {
  width: 100%;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
