<template>
  <div
    class="contact-wrapper"
    :class="{
      'contact-wrapper--noAuth': !isAuthenticated || !isVerified
    }"
  >
    <div
      class="contact"
      :class="{ 'contact--noAuth': !isAuthenticated || !isVerified }"
    >
      <div class="contact__header">
        Contact Us
      </div>

      <div class="contact__description">
        Our <a href="https://upchieve.org/faqs" target="_blank" rel="noopener noreferrer">FAQ page</a> is the fastest way
        to find answers. Or you can fill out this form and we'll get back to
        you as soon as possible! Alternatively, you can always email us directly
        at <a href="mailto:support@upchieve.org">support@upchieve.org</a>.
      </div>

      <div class="contact__description" v-if="sendState === sendStates.SENT">
        Thank you for contacting us! We'll get back to you as soon as possible.
      </div>

      <div
        class="contact-form contact__form"
        v-if="sendState !== sendStates.SENT"
      >
        <div
          v-if="!hasValidEmail"
          class="contact-form__section"
          id="contact-form-email"
        >
          <div class="contact-form__label">Your email</div>
          <input
            class="contact-form__text"
            type="text"
            v-model="contactFormData.userEmail"
          />
        </div>

        <div class="contact-form__section">
          <div class="contact-form__label">Select reason</div>
          <v-select
            class="contact-form__select"
            v-model="contactFormData.topic"
            :options="contactTopics"
            :searchable="false"
          ></v-select>
        </div>

        <div class="contact-form__section">
          <div class="contact-form__label">Message</div>
          <textarea
            class="contact-form__textarea"
            v-model="contactFormData.message"
            rows="5"
          />
        </div>

        <div v-if="this.sendState === sendStates.ERROR" class="errors">
          A valid email is required.
        </div>

        <div class="contact-form__section">
          <large-button
            class="contact-form__submit"
            primary
            @click.native="submitContactUs"
          >
            Send
          </large-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import NetworkService from '../services/NetworkService'
import LargeButton from '@/components/LargeButton'
import isEmail from 'validator/lib/isEmail'
import Gleap from 'gleap'

const sendStates = {
  UNSENT: 'Unsent',
  SENT: 'Sent',
  ERROR: 'Error'
}

export default {
  name: 'contact-view',
  components: { LargeButton },
  created() {
    if (!this.isAuthenticated || !this.isVerified) {
      this.$store.dispatch('app/hideNavigation')
    }
  },
  data() {
    const contactTopics = [
      'General question',
      'General feedback',
      'Technical issue',
      'Feature request',
      'Subject suggestion',
      'Other'
    ]

    return {
      contactTopics,
      isSendingForm: false,
      contactFormData: {
        userEmail: '',
        userId: '',
        topic: contactTopics[0],
        message: ''
      },
      sendState: sendStates.UNSENT,
      sendStates: {
        UNSENT: 'Unsent',
        SENT: 'Sent',
        ERROR: 'Error'
      }
    }
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      isVerified: 'user/isVerified'
    }),
    hasValidEmail() {
      if (!this.isAuthenticated) return false

      return this.isValidEmail(this.$store.state.user.user.email)
    }
  },
  watch: {
    isAuthenticated(isAuthed) {
      if (isAuthed) {
        this.$store.dispatch('app/showNavigation')
      } else {
        this.$store.dispatch('app/hideNavigation')
      }
    }
  },
  methods: {
    async submitContactUs() {
      if (
        !this.isAuthenticated &&
        !this.isValidEmail(this.contactFormData.userEmail)
      ) {
        this.sendState = this.sendStates.ERROR
      } else {
        if (this.hasValidEmail) {
          this.contactFormData.userEmail = this.$store.state.user.user.email
        }
        if (this.isAuthenticated) {
          this.contactFormData.userId = this.$store.state.user.user._id
        }

        // send the same message to our bug ticket tracker
        if (this.contactFormData.topic === this.contactTopics[2]) {
          if (!this.isAuthenticated) Gleap.setCustomData('email', this.contactFormData.userEmail)
          Gleap.sendSilentBugReport(this.contactFormData.message, "LOW")
          if (!this.isAuthenticated) Gleap.clearCustomData()
        }

        // there's not much a user can do at this point
        // if there's an error, so we're catching them on the backend
        // and otherwise just moving the user on
        NetworkService.sendContact(this, this.contactFormData)

        this.sendState = this.sendStates.SENT
      }
    },
    isValidEmail(address) {
      return isEmail(String(address).toLowerCase())
    }
  }
}
</script>

<style lang="scss" scoped>
.contact-wrapper {
  padding: 40px 20px;

  @include breakpoint-above('large') {
    padding: 40px;
  }

  &--noAuth {
    @include flex-container(row, center, center);
    background: url('~@/assets/onboarding_background.png') no-repeat center
      fixed;
    background-size: cover;
    min-height: 100vh;
  }
}

.contact {
  @include flex-container(column, space-between, flex-start);
  max-width: 800px;
  padding: 40px 20px;
  border-radius: 8px;
  background: #fff;

  @include breakpoint-above('large') {
    padding: 40px 40px 60px;
  }

  &__header {
    color: $c-soft-black;
    font-size: 24px;
    font-weight: 500;
  }

  &__description {
    max-width: 500px;
    text-align: left;
    margin: 10px 0 35px;
    color: $c-secondary-grey;
    font-size: 14px;
  }

  &__form {
    align-self: stretch;
  }

  &--noAuth {
    border-radius: 0;
    margin-left: auto;
    margin-right: auto;
    flex-basis: 500px;
  }
}

.contact-form {
  @include child-spacing(top, 30px);
  max-width: 500px;

  &__section {
    @include flex-container(column, space-between, stretch);
  }

  &__label {
    font-size: 16px;
    font-weight: 600;
    align-self: flex-start;
    margin-bottom: 10px;
  }

  &__text,
  &__textarea {
    border: solid 1px $c-border-grey;
    border-radius: 4px;
    font-size: 16px;
    padding: 10px 15px;

    &:focus {
      outline: none;
    }
  }

  &__textarea {
    resize: none;
  }

  &__select {
    font-size: 16px;
  }
}

.errors {
  color: #bf0000;
  font-size: 14px;
  text-align: center;
}
</style>
