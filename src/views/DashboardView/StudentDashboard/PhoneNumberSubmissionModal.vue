<template>
  <div class="phone-number">
    <modal :backText="''">
      <template>
        <div class="phone-number-modal">
          <header>
            <h1 class="phone-number-modal__title">
              Did you know you can earn $5 a week for having a session?! 💸🎓
            </h1>
            <p class="phone-number-modal__body">
              Sign up for text reminders and never miss out on the opportunity
              to earn and learn.
            </p>
          </header>

          <section class="phone-number-modal__section">
            <label class="phone-number-modal__phone-input">
              Phone Number
              <vue-phone-number-input
                class="phone-number-modal__phone-input"
                v-model="phone"
                :error="phone !== '' && !isValidPhone"
                :default-country-code="internationalPhoneInfo.country"
                :required="true"
                color="#555"
                valid-color="#16ba97"
                @update="data => (phoneInput = data)"
              />

              <span v-if="!isValidPhone && isPhoneError" class="error"
                >Please enter a valid phone number.</span
              >
            </label>
            <p v-if="hasError" class="error">
              We were unable to save your number. Please try again.
            </p>
          </section>
          <footer class="phone-number-modal__footer">
            <div
              class="phone-number-modal__buttons phone-number-modal__buttons--secondary"
            >
              <large-button
                class="phone-number-modal__buttons-button"
                @click.native="handleCloseModal"
                >No, thanks</large-button
              >
              <large-button
                class="phone-number-modal__buttons-button phone-number-modal__buttons-button--primary"
                @click.native="handlePhoneSubmission"
                :disabled="phone === '' || !isValidPhone"
                primary
                :showArrow="false"
                >Done</large-button
              >
            </div>
          </footer>
        </div>
      </template>
    </modal>
  </div>
</template>

<script>
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import UserService from '@/services/UserService'
import PhoneNumber from 'awesome-phonenumber'
import VuePhoneNumberInput from 'vue-phone-number-input'
import { mapState } from 'vuex'

export default {
  name: 'phone-numberPreventionModal',
  components: {
    Modal,
    LargeButton,
    VuePhoneNumberInput,
  },
  data() {
    return {
      phone: '',
      isPhoneError: false,
      phoneInput: {},
      hasError: false,
    }
  },
  mounted() {
    localStorage.setItem('hasPhoneNumberSubmissionModal', true)
    AnalyticsService.captureEvent(
      EVENTS.STUDENT_FALL_INCENTIVE_PROGRAM_PHONE_NUMBER_MODAL_SHOWN
    )
    if (this.user.phone) {
      const pn = new PhoneNumber(this.user.phone)
      this.phone = pn.getNumber('national')
      // Hack to initially mock the vue-phone-number-input data
      this.phoneInput = {
        isValid: true,
        e164: pn.getNumber('e164'),
        error: '',
      }
    }
  },

  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    isValidPhone() {
      return this.phoneInput.isValid
    },
    internationalPhoneInfo() {
      if (!this.user.phone) return null

      const pn = new PhoneNumber(this.user.phone)

      return {
        number: pn.getNumber('international'),
        country: pn.getRegionCode(),
      }
    },
  },
  props: {
    closeModal: { required: true, type: Function },
  },
  methods: {
    handleCloseModal() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_FALL_INCENTIVE_PROGRAM_MODAL_CLOSED
      )
      this.closeModal()
    },
    async handlePhoneSubmission() {
      if (!this.isValidPhone) this.phoneError = true

      try {
        await UserService.setProfile({
          phone: this.phoneInput.e164,
          // Ideally we'd be able to partially update a user while omitting properties
          // or make this function automatically spread in needed properties
          isDeactivated: this.user.isDeactivated,
        })
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_FALL_INCENTIVE_PROGRAM_PHONE_NUMBER_SUBMITTED
        )
      } catch (error) {
        this.hasError = true
      }

      this.closeModal()
    },
  },
}
</script>

<style lang="scss" scoped>
.phone-number-modal {
  text-align: initial;

  &__title {
    @include font-category('display-small');
    font-weight: 500;
    margin-top: 1em;
    margin-bottom: 1em;
  }

  &__subtitle {
    @include font-category('display-small');
    margin-bottom: 0.5em;
    margin-top: 1em;
  }

  &__body {
    @include font-category('heading');
    margin-bottom: 0.5em;
    margin-top: 1em;
  }

  &__buttons {
    @include flex-container(row, space-between, center);
    margin: 1.6em 0 0.4em 0;
    & span:first-child,
    & button:first-child {
      margin-right: 1em;
    }

    &-button {
      margin: 0 auto;
      width: 100%;
      margin-bottom: 1.3em;

      @include breakpoint-above('small') {
        width: 250px;
        margin-bottom: initial;
      }

      &--primary {
        background-color: $c-information-blue;
        &:hover {
          background: darken($c-information-blue, 5%);

          &:disabled {
            background: $c-background-grey;
          }
        }
      }
    }

    &--secondary {
      @include flex-container(row, flex-end, center);
      & button {
        margin: initial;
      }
    }
  }

  &__phone-input {
    margin-top: 0.4em;
    width: 100%;
    font-weight: 500;
  }
}

.error {
  color: $c-error-red;
  margin: 1em 0;
}

.fall-incentive-link {
  color: $c-information-blue;
}
</style>
