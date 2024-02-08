<template>
  <div class="tell-them-cp">
    <modal v-if="showModal" :backText="''">
      <template v-if="step === 1">
        <div class="tell-them-cp-modal">
          <header>
            <updog-college class="updog-college" />
          </header>

          <section class="tell-them-cp-modal__section">
            <p class="tell-them-cp-modal__subtitle">Want to go to college?</p>
            <p class="tell-them-cp-modal__message">
              1:1 college prep tutors are available now!
            </p>
          </section>
          <footer class="tell-them-cp-modal__footer">
            <div class="tell-them-cp-modal__buttons">
              <large-button
                class="tell-them-cp-modal__buttons-button tell-them-cp-modal__buttons-button--primary"
                primary
                :showArrow="false"
                @click.native="startSession"
                >Start a college chat</large-button
              >
            </div>
            <div class="tell-them-cp-modal__text--center">
              <span
                @click="handleNotInterested"
                class="tell-them-cp-modal__text--not-interested"
                >I'm not interested</span
              >
            </div>
          </footer>
        </div>
      </template>
      <template v-if="step === 2">
        <div class="tell-them-cp-modal">
          <header>
            <arrow-icon
              class="arrow-icon"
              @click="() => handleBackButton('Create reminder')"
            />
            <h1 class="tell-them-cp-modal__title">Create Reminder</h1>
          </header>

          <section class="tell-them-cp-modal__section">
            <p>UPchieve College Prep</p>
            <div class="tell-them-cp-modal__reminder-container">
              <label class="tell-them-cp-modal__reminder-label">
                Date
                <input
                  id="reminder-date"
                  class="tell-them-cp-modal__reminder-input"
                  type="date"
                  v-model="reminderDate"
                  :min="todaysDate"
                />
              </label>
              <label class="tell-them-cp-modal__reminder-label">
                Time
                <input
                  id="reminder-time"
                  type="time"
                  v-model="reminderTime"
                  class="tell-them-cp-modal__reminder-input"
                />
              </label>
            </div>
          </section>
          <footer class="tell-them-cp-modal__footer">
            <div
              class="tell-them-cp-modal__buttons tell-them-cp-modal__buttons--secondary"
            >
              <span
                @click="askConfirmation"
                class="tell-them-cp-modal__buttons--cancel"
                >Cancel</span
              >
              <large-button
                class="tell-them-cp-modal__buttons-button tell-them-cp-modal__buttons-button--primary"
                primary
                :showArrow="false"
                @click.native="handleReminderDate"
                :disabled="!(reminderDate && reminderTime)"
                >Continue</large-button
              >
            </div>
          </footer>
        </div>
      </template>
      <template v-if="step === 3">
        <div class="tell-them-cp-modal">
          <arrow-icon
            class="arrow-icon"
            @click="() => handleBackButton('Enter phone')"
          />
          <header>
            <h1 class="tell-them-cp-modal__subtitle">
              We will send you a text reminder at<br />{{
                formattedReminderDate
              }}
            </h1>
          </header>

          <section class="tell-them-cp-modal__section">
            <label class="tell-them-cp-modal__phone-input">
              Phone Number
              <vue-phone-number-input
                class="tell-them-cp-modal__phone-input"
                v-model="phone"
                :error="phone !== '' && !isValidPhone"
                :required="true"
                color="#555"
                valid-color="#16ba97"
                @update="(data) => (phoneInput = data)"
              />
              <span v-if="!isValidPhone && isPhoneError" class="error"
                >Please enter a valid phone number.</span
              >
            </label>
          </section>
          <footer class="tell-them-cp-modal__footer">
            <div
              class="tell-them-cp-modal__buttons tell-them-cp-modal__buttons--secondary"
            >
              <large-button
                class="tell-them-cp-modal__buttons-button"
                @click.native="askConfirmation"
                >Cancel</large-button
              >
              <large-button
                class="tell-them-cp-modal__buttons-button tell-them-cp-modal__buttons-button--primary"
                @click.native="handleRemindMeSubmit"
                :disabled="phone === '' || !this.isValidPhone"
                primary
                :showArrow="false"
                >Done</large-button
              >
            </div>
          </footer>
        </div>
      </template>
      <template v-if="step === 4">
        <div class="tell-them-cp-modal">
          <header class="tell-them-cp-modal__header--middle">
            <updog-with-flag class="updog-flag" />
            <h1 class="tell-them-cp-modal__title">You're all set!</h1>
          </header>

          <footer class="tell-them-cp-modal__footer">
            <div class="tell-them-cp-modal__buttons">
              <large-button
                class="tell-them-cp-modal__buttons-button tell-them-cp-modal__buttons-button--primary"
                primary
                :showArrow="false"
                @click.native="closeModal"
                >Okay</large-button
              >
            </div>
          </footer>
        </div>
      </template>
      <template v-if="step === -1">
        <div class="tell-them-cp-modal">
          <header class="tell-them-cp-modal__header--middle">
            <h1 class="tell-them-cp-modal__title">
              Are you sure you don't want us to remind you?
            </h1>
          </header>

          <footer class="tell-them-cp-modal__footer">
            <div class="tell-them-cp-modal__buttons">
              <large-button
                class="tell-them-cp-modal__buttons-button"
                @click.native="handleDontRemindMe"
                >Don't remind me</large-button
              >
              <large-button
                class="tell-them-cp-modal__buttons-button tell-them-cp-modal__buttons-button--primary"
                primary
                :showArrow="false"
                @click.native="handleRemindMeClick"
                >Remind me</large-button
              >
            </div>
          </footer>
        </div>
      </template>
    </modal>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import setCookie from '@/utils/set-cookie'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import moment from 'moment'
import UpdogCollege from '@/assets/updog-college.svg'
import UpdogWithFlag from '@/assets/updog-with-flag.svg'
import VuePhoneNumberInput from 'vue-phone-number-input'
import ArrowIcon from '@/assets/arrow.svg'

export default {
  name: 'CollegePrepModal',
  components: {
    Modal,
    LargeButton,
    UpdogCollege,
    UpdogWithFlag,
    VuePhoneNumberInput,
    ArrowIcon,
  },
  data() {
    return {
      step: 1,
      showModal: true,
      reminderDate: '',
      reminderTime: '',
      phone: '',
      isPhoneError: false,
      phoneInput: {},
    }
  },
  mounted() {
    AnalyticsService.captureEvent(EVENTS.STUDENT_TELL_THEM_CP_MODAL_SHOWN)
    setCookie('hasSeenTellThemCollegePrepModal', true)
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    formattedReminderDate() {
      return moment(this.dateTime, 'YYYY-MM-DD HH:mm').format(
        'MM/DD/YYYY h:mm a'
      )
    },
    isValidPhone() {
      return this.phoneInput.isValid
    },
    todaysDate() {
      return new Date().toISOString().split('T')[0]
    },
    dateTime() {
      return `${this.reminderDate} ${this.reminderTime}`
    },
  },
  methods: {
    toggleModal() {
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
    },
    nextStep() {
      this.step = this.step + 1
    },
    prevStep() {
      this.step = this.step - 1
    },
    handleBackButton(step) {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_TELL_THEM_CP_CLICKED_BACK_BUTTON,
        {
          step,
        }
      )
      this.prevStep()
    },
    handleNotInterested() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_TELL_THEM_CP_CLICKED_NOT_INTERESTED
      )
      this.closeModal()
    },
    handleDontRemindMe() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_TELL_THEM_CP_CLICKED_DONT_REMIND_ME
      )
      this.closeModal()
    },
    handleRemindMeClick() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_TELL_THEM_CP_CLICKED_REMIND_ME
      )
      this.step = 2
    },
    handleReminderDate() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_TELL_THEM_CP_ENTERED_REMINDER_DATE
      )
      this.nextStep()
    },
    handleRemindMeSubmit() {
      if (this.isInvalidPhone) this.phoneError = true

      AnalyticsService.captureEvent(EVENTS.STUDENT_TELL_THEM_CP_REMINDER, {
        etDate: this.handleDate('America/New_York'),
        gmtDate: this.handleDate('GMT'),
        userLink: `https://app.upchieve.org/admin/users/${this.user.id}`,
      })
      this.nextStep()
    },
    startSession() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_TELL_THEM_CP_STARTED_SESSION)
      this.$router.push('/session/college/college-prep/')
    },
    handleDate(timezone) {
      return moment(this.dateTime, 'YYYY-MM-DD HH:mm')
        .tz(timezone)
        .format('MM-DD-YYYY HH:mm')
    },
    askConfirmation() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_TELL_THEM_CP_CANCEL_CONFIRMATION
      )
      this.step = -1
    },
  },
}
</script>

<style lang="scss" scoped>
.tell-them-cp-modal {
  text-align: initial;
  &__progress-bar {
    width: 100%;
    margin: 1em 0;
  }

  &__title {
    @include font-category('display-small');
    font-weight: 500;
    margin-top: 1em;
  }

  &__subtitle {
    @include font-category('display-small');
    margin-bottom: 0.5em;
    margin-top: 1em;
  }

  &__buttons {
    @include flex-container(row, space-between, center);
    &-button {
      margin: 0 auto;

      @include breakpoint-above('small') {
        width: 250px;
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
      margin: 1.6em 0 0.4em 0;

      & span:first-child,
      & button:first-child {
        margin-right: 1em;
      }

      & button {
        margin: initial;
      }
    }

    &--cancel {
      &:hover {
        cursor: pointer;
      }
    }
  }

  &__text--center {
    @include flex-container(row, center);
  }

  &__text--not-interested {
    text-decoration: underline;
    // @include flex-container(row, center);
    margin: 1em 0;

    &:hover {
      cursor: pointer;
    }
  }

  &__reminder-container {
    @include flex-container(row, space-between, center);
  }

  &__reminder-label {
    @include flex-container(column);
    font-weight: 500;
    width: 45%;
    border-color: $c-secondary-grey;
  }

  &__reminder-input {
    margin-top: 0.4em;
  }

  &__phone-input {
    margin-top: 0.4em;
    margin-bottom: 1em;
    width: 100%;
    font-weight: 500;
  }

  &__header--middle {
    @include flex-container(column, center, center);
    margin-bottom: 2em;
  }
}

.updog {
  &-flag {
    width: 150px;
    height: 150px;
  }

  &-college {
    width: 100%;
    height: 100%;
  }
}

.error {
  color: $c-error-red;
  margin: 1em 0;
}

.arrow-icon {
  width: 20px;
  transform: rotate(180deg);

  &:hover {
    cursor: pointer;
  }
}
</style>
