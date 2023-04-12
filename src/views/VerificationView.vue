<template>
  <form-page-template>
    <form class="uc-form" aria-labelledby="verificationForm">
      <nav class="uc-form-header" aria-label="Options">
        <div
          class="uc-form-header-link verification__log-out-button"
          v-on:click="logout"
          v-on:keydown.enter="logout"
        >
          Log out
        </div>
      </nav>
      <div class="uc-form-body" v-if="step === 1">
        <div v-if="error">
          <p class="error" role="alert">
            {{ error }}
          </p>

          <button
            class="uc-form-button"
            type="submit"
            @click.prevent="sendCode"
            :disabled="!isValidForm || isSubmitting"
          >
            {{ sendCodeButtonText }}
          </button>
        </div>
      </div>

      <div class="uc-form-body" v-if="step === 2">
        <p>
          We just emailed your verification code to
          <span class="verification__send-to">{{ email }}</span>
        </p>
        <div class="verification__container">
          <label class="verification__radio-label">
            <span class="verification__label"
              >Enter your 6-digit verification code:</span
            >
            <input
              class="uc-form-input uc-form-input--wide"
              v-model="verificationCode"
              type="input"
              id="verification-code"
              placeholder="XXXXXX"
            />
          </label>
        </div>

        <p v-if="error" class="error" role="alert">
          {{ error }}
        </p>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="confirmVerificationCode"
          :disabled="!isValidVerificationCode"
        >
          Verify my account
        </button>

        <div class="uc-form-subtext verification__sub-text">
          Did not receive an email?
          <span
            :disabled="isSubmitting"
            @click.prevent="sendCode"
            class="verification__sub-link"
            >Resend code</span
          >
        </div>
      </div>

      <div v-if="step === 3" class="uc-form-body uc-form-body--center">
        <div>
          <verification-badge />
          <h3>You’re verified <span v-if="showEmoji">😎</span></h3>
          <p>
            Woohoo! Welcome to UPchieve.
          </p>
        </div>
        <div>
          <large-button
            primary
            :routeTo="
              isForcedTrainingActive && user.isVolunteer ? '/welcome' : '/'
            "
            class="uc-form-button-big"
          >
            Take me to the dashboard
          </large-button>
        </div>
      </div>

      <form-footer />
    </form>
    <loader v-if="isSubmitting" :message="loadingMessage" overlay />
  </form-page-template>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import FormPageTemplate from '@/components/FormPageTemplate'
import FormFooter from '@/components/FormFooter'
import Loader from '@/components/Loader'
import AuthService from '@/services/AuthService'
import VerificationBadge from '@/assets/verification.svg'
import LargeButton from '@/components/LargeButton'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'

export default {
  name: 'VerificationView',
  components: {
    FormPageTemplate,
    FormFooter,
    VerificationBadge,
    LargeButton,
    Loader,
  },
  data() {
    return {
      step: 1,
      verificationCode: '',
      loadingMessage: '',
      error: '',
      isSubmitting: true,
      email: '',
    }
  },
  mounted() {
    this.$store.dispatch('app/hideNavigation')
    this.email = this.user.email
    this.sendCode(true)
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      isForcedTrainingActive: 'featureFlags/isForcedTrainingActive',
    }),
    isValidVerificationCode() {
      return !(
        this.verificationCode.length !== 6 ||
        isNaN(Number(this.verificationCode))
      )
    },
    sendCodeButtonText() {
      if (this.isSubmitting) {
        return 'Sending...'
      }

      return 'Resend verification code'
    },
    showEmoji() {
      return !this.user.isVolunteer
    },
  },
  methods: {
    async sendCode(force) {
      this.error = ''
      if (!force && this.isSubmitting) return
      this.isSubmitting = true
      this.loadingMessage = 'Sending a verification email. Please wait...'
      try {
        await AuthService.initiateVerification({
          sendTo: this.email,
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        })
        this.step = 2
        this.error = ''
      } catch (error) {
        this.handleRequestError(error)
      }

      this.isSubmitting = false
      this.loadingMessage = ''
    },
    async confirmVerificationCode() {
      this.error = ''
      if (this.isSubmitting) return
      this.isSubmitting = true

      if (!this.isValidVerificationCode) {
        this.error = 'Please enter a 6-digit verification code'
        return
      }

      try {
        const {
          data: { success },
        } = await AuthService.confirmVerification({
          verificationCode: this.verificationCode,
          sendTo: this.email,
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        })
        if (success) {
          AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED, {
            event: EVENTS.ACCOUNT_VERIFIED,
          })
          this.$store.dispatch('user/firstDashboardVisit', true)
          this.$store.dispatch('user/addToUser', {
            verified: true,
          })
          this.step = 3
        } else {
          this.error =
            'Please enter the most recent verification code that was sent to you'
        }
      } catch (error) {
        this.handleRequestError(error)
      }
      this.isSubmitting = false
    },
    handleRequestError(error) {
      if (error.status !== 422) LoggerService.noticeError(error)
      this.error =
        error.message ||
        'Sorry, looks like something went wrong. Please try again in a few minutes.'
    },
    logout() {
      AuthService.logout(this)
    },
  },
}
</script>

<style lang="scss" scoped>
.uc-form-body {
  text-align: center;
}

.subtitle {
  @include font-category('heading');
}

.verification {
  &__container {
    @include flex-container(row, flex-start, center);
  }

  &__radio-label {
    @include flex-container(column, flex-start, flex-start);
    padding-left: 2em;
  }

  &__label {
    font-weight: 500;
  }

  &__sub-text {
    text-align: center;
    padding-top: 1em;
  }

  &__sub-link {
    cursor: pointer;
    &:hover {
      font-weight: 500;
    }
  }

  .verification-nav__button {
    text-align: left;
    margin-top: 1em;
    margin-left: 1em;
  }

  &__back-button {
    color: #417db1;
    border-radius: 20px;
    padding: 5px 15px;
    cursor: pointer;

    &:hover {
      background: #f7fcfe;
    }
  }

  &__send-to {
    display: block;
    font-weight: 500;
  }

  &__log-out-button {
    margin-left: auto;
    &:hover {
      text-decoration: underline;
    }
  }
  &__field {
    text-align: left;
    width: 300px;
    border-bottom: 3px solid $c-success-green;
    padding: initial;
  }
}

.uc-form-input--wide {
  width: 300px;
}

.uc-form-button {
  text-transform: initial;
  background: darken($c-success-green, 5%);
  color: $c-background-grey;
  &:disabled {
    background: $c-background-grey;
    color: darken($c-success-green, 5%);
  }
}

.error {
  color: $c-error-red;
  margin-bottom: 0;
}
</style>
