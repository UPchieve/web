<template>
  <div class="procrastination">
    <modal v-if="showModal" :backText="''">
      <template v-if="step === 1">
        <cross-icon class="cross-icon" @click="handleCloseModal" />
        <div class="procrastination-modal">
          <header>
            <updog-procrastination class="updog" />
          </header>

          <section class="procrastination-modal__section">
            <h1
              class="procrastination-modal__title procrastination-modal__title--center"
            >
              Are you struggling with procrastination?
            </h1>
          </section>
          <footer class="procrastination-modal__footer">
            <div class="procrastination-modal__buttons">
              <large-button
                class="procrastination-modal__buttons-button"
                :showArrow="false"
                @click.native="handleNotStruggling"
                >No</large-button
              >
              <large-button
                class="procrastination-modal__buttons-button"
                :showArrow="false"
                @click.native="handleIsStruggling"
                >Yes</large-button
              >
            </div>
          </footer>
        </div>
      </template>
      <template v-if="step === 2">
        <div class="procrastination-modal">
          <header>
            <h1 class="procrastination-modal__subtitle">
              We can help remind you to stay on track!
            </h1>
          </header>

          <section class="procrastination-modal__section">
            <label class="procrastination-modal__phone-input">
              Phone Number
              <vue-phone-number-input
                class="procrastination-modal__phone-input"
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
          </section>
          <footer class="procrastination-modal__footer">
            <div
              class="procrastination-modal__buttons procrastination-modal__buttons--secondary"
            >
              <large-button
                class="procrastination-modal__buttons-button"
                @click.native="showCancelConfirmation"
                >No, thanks</large-button
              >
              <large-button
                class="procrastination-modal__buttons-button procrastination-modal__buttons-button--primary"
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
      <template v-if="step === 3">
        <div class="procrastination-modal">
          <header>
            <h1 class="procrastination-modal__title">
              Great! You are all set.
            </h1>
            <p class="procrastination-modal__body">
              We will send you a text reminder at {{ reminderFormatted }}.
            </p>
          </header>

          <footer class="procrastination-modal__footer">
            <div
              class="procrastination-modal__buttons procrastination-modal__buttons--col"
            >
              <large-button
                @click.native="handleSelectNewTime"
                class="procrastination-modal__buttons-button"
                >Change reminder</large-button
              >
              <large-button
                class="procrastination-modal__buttons-button procrastination-modal__buttons-button--primary"
                primary
                :showArrow="false"
                @click.native="handleRemindMeSubmit"
                :disabled="phone === '' || !this.isValidPhone"
                >Done</large-button
              >
            </div>
          </footer>
        </div>
      </template>
      <template v-if="step === 4">
        <div class="procrastination-modal">
          <header>
            <h1 class="procrastination-modal__title">
              Create Reminder
            </h1>
          </header>

          <section class="procrastination-modal__section">
            <div class="procrastination-modal__reminder-container">
              <label class="procrastination-modal__reminder-label">
                Date
                <input
                  id="reminder-date"
                  class="procrastination-modal__reminder-input"
                  type="date"
                  v-model="reminderDate"
                  :min="todaysDate"
                />
              </label>
              <label class="procrastination-modal__reminder-label">
                Time
                <input
                  id="reminder-time"
                  type="time"
                  v-model="reminderTime"
                  class="procrastination-modal__reminder-input"
                />
              </label>
            </div>
          </section>
          <footer class="procrastination-modal__footer">
            <div
              class="procrastination-modal__buttons procrastination-modal__buttons--secondary"
            >
              <span
                @click="handleCancelCustomDate"
                class="procrastination-modal__buttons--cancel"
                >Cancel</span
              >
              <large-button
                class="procrastination-modal__buttons-button procrastination-modal__buttons-button--primary"
                primary
                :showArrow="false"
                @click.native="handleReminderTimeUpdate"
                :disabled="!(reminderDate && reminderTime)"
                >Continue</large-button
              >
            </div>
          </footer>
        </div>
      </template>
      <template v-if="step === -1">
        <div class="procrastination-modal">
          <header class="procrastination-modal__header--middle">
            <h1 class="procrastination-modal__title">
              Are you sure you don't want us to remind you?
            </h1>
          </header>

          <footer class="procrastination-modal__footer">
            <div
              class="procrastination-modal__buttons procrastination-modal__buttons--col"
            >
              <large-button
                class="procrastination-modal__buttons-button"
                @click.native="handleDontRemindMe"
                >Don't remind me</large-button
              >
              <large-button
                class="procrastination-modal__buttons-button
               procrastination-modal__buttons-button--primary"
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
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import { EVENTS } from '@/consts'
import moment from 'moment'
import UpdogProcrastination from '@/assets/updog-procrastination.svg'
import VuePhoneNumberInput from 'vue-phone-number-input'
import CrossIcon from '@/assets/cross.svg'
import PhoneNumber from 'awesome-phonenumber'

export default {
  name: 'ProcrastinationPreventionModal',
  components: {
    Modal,
    LargeButton,
    UpdogProcrastination,
    VuePhoneNumberInput,
    CrossIcon,
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
    AnalyticsService.captureEvent(
      EVENTS.STUDENT_PROCRASTINATION_PREVENTION_MODAL_SHOWN
    )
    localStorage.setItem('hasSeenProcrastinationPreventionModal', true)
    const pn = new PhoneNumber(this.user.phone)
    this.phone = pn.getNumber('national')
    // Hack to initially mock the vue-phone-number-input data
    this.phoneInput = {
      isValid: true,
      e164: pn.getNumber('e164'),
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      latestSession: state => state.user.latestSession,
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
    earliestReminderTimeByLatestSession() {
      return this.closestHalfHour(
        moment(this.latestSession.createdAt).add(1, 'day')
      ).format('MM/DD/YYYY h:mm a')
    },
    reminderFormatted() {
      if (this.reminderDate && this.reminderTime)
        return this.formattedReminderDate
      return this.earliestReminderTimeByLatestSession
    },
    internationalPhoneInfo() {
      if (!this.user.phone) return { number: '', country: '' }

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
    handleCloseModal() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_MODAL_CLOSED
      )
      this.closeModal()
    },
    showCancelConfirmation() {
      this.step = -1
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_SHOWN_CANCEL_CONFIRMATION
      )
    },
    handleCancelCustomDate() {
      this.step = 3
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CANCEL_CUSTOM_DATE
      )
    },
    handleCancelConfirm() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CANCEL_CONFIRMED
      )
      this.closeModal()
    },
    handleNotStruggling() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CLICKED_NOT_STRUGGLING
      )
      this.closeModal()
    },
    handleIsStruggling() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CLICKED_STRUGGLING
      )
      this.step++
    },
    handlePhoneSubmission() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_PHONE_SUBMITTED
      )
      this.step++
    },
    handleReminderTimeUpdate() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CHANGED_REMINDER_DATE,
        {
          gmtDate: moment(this.reminderFormatted, 'MM-DD-YYYY HH:mm a')
            .tz('GMT')
            .format('MM-DD-YYYY HH:mm'),
        }
      )
      this.step = 3
    },
    handleDontRemindMe() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CLICKED_DONT_REMIND_ME
      )
      this.closeModal()
    },
    handleRemindMeClick() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CLICKED_REMIND_ME
      )
      this.step = 2
    },
    handleSelectNewTime() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_CLICKED_CHANGE_REMINDER_DATE
      )
      this.step++
    },
    async handleRemindMeSubmit() {
      if (!this.isValidPhone) this.phoneError = true

      AnalyticsService.captureEvent(
        EVENTS.STUDENT_PROCRASTINATION_PREVENTION_REMINDER_SUBMITTED
      )
      await NetworkService.queueStudentsTextReminder({
        phone: this.phoneInput.e164,
        reminderDate: this.handleDate(),
      })
      this.closeModal()
    },
    handleDate() {
      if (this.reminderFormatted)
        return moment(this.reminderFormatted, 'MM-DD-YYYY HH:mm a').format(
          'MM-DD-YYYY HH:mm'
        )

      // Default to sending tomorrow at start of an hour
      return moment()
        .add(1, 'day')
        .startOf('hour')
        .format('MM/DD/YYYY h:mm a')
    },
    closestHalfHour(inputDate) {
      const date = moment(inputDate)
      const minutes = date.minutes()

      if (minutes < 30) {
        date.minutes(0)
      } else {
        date.minutes(30)
      }

      // Reset seconds and milliseconds to get exact half-hour
      date.seconds(0)
      date.milliseconds(0)

      return date
    },
  },
}
</script>

<style lang="scss" scoped>
.procrastination-modal {
  text-align: initial;

  &__title {
    @include font-category('display-small');
    font-weight: 500;
    margin-top: 1em;
    margin-bottom: 1em;

    &--center {
      text-align: center;
    }
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

    &--col {
      @include flex-container(column, initial, center);
      @include breakpoint-above('small') {
        @include flex-container(row, space-between, center);
      }

      & button {
        margin-right: initial;
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
    width: 100%;
    font-weight: 500;
  }

  &__header--middle {
    @include flex-container(column, center, center);
    margin-bottom: 2em;
  }
}

.updog {
  width: 100%;
  height: 100%;
}

.error {
  color: $c-error-red;
  margin: 1em 0;
}

.cross-icon {
  width: 18px;
  float: right;
  margin-right: 1em;
  margin-bottom: 1em;

  &:hover {
    cursor: pointer;
  }

  @include breakpoint-above('medium') {
    margin-bottom: initial;
    margin-right: initial;
    float: initial;
    margin-left: auto;
  }
}
</style>
