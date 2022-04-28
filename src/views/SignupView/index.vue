<template>
  <form-page-template>
    <div class="uc-form">
      <nav class="uc-form-header" aria-label="Other options">
        <router-link
          to="/login"
          class="uc-form-header-link"
          v-if="!isReferred && isLoginLinkVisible"
          >Log In</router-link
        >
      </nav>

      <volunteer-form v-if="this.userSelection === 'volunteer'" />
      <student-form
        v-else-if="this.userSelection === 'student'"
        @hideLoginLink="hideLoginLink"
      />
      <div v-else class="uc-form-body uc-form-body--center">
        <div>
          <h3>
            {{ welcomeMessage }}
          </h3>
          <p v-if="isReferred" class="uc-form-text uc-form-text--referred">
            UPchieve is a nonprofit that provides <b>100% free</b> online
            tutoring and college counseling, available 24/7! Since
            {{ firstName }} invited you, you can skip our wait list!
          </p>
          <p v-else class="uc-form-text">
            We are a nonprofit that provides free, online tutoring and college
            counseling to eligible high school students.
          </p>
        </div>
        <nav class="btn-container" aria-labelledby="signupMenuSubheader">
          <h4 class="uc-subheader" id="signupMenuSubheader" v-if="!isReferred">
            How can we help you?
          </h4>
          <div v-if="isReferred">
            <button
              class="uc-form-button-big uc-form-button--referral"
              type="submit"
              @click.prevent="selectStudent()"
            >
              Awesome! I'm ready to sign up
            </button>

            <a
              target="_blank"
              rel="noopener noreferrer"
              class="uc-form-button-big uc-form-button--link uc-form-button--referral"
              href="https://upchieve.org/students"
              >Tell me more about UPchieve first
            </a>
          </div>
          <div v-else>
            <button
              class="uc-form-button-big"
              type="submit"
              @click.prevent="selectStudent()"
            >
              I need an Academic Coach
            </button>

            <button
              class="uc-form-button-big"
              type="submit"
              @click.prevent="selectVolunteer()"
            >
              I’d like to become an Academic Coach
            </button>
          </div>
        </nav>
      </div>
      <form-footer v-if="!isMobileApp" />
    </div>
  </form-page-template>
</template>

<script>
import { mapState } from 'vuex'
import FormPageTemplate from '@/components/FormPageTemplate'
import StudentForm from './StudentForm'
import VolunteerForm from './VolunteerForm'
import FormFooter from '@/components/FormFooter'
import NetworkService from '@/services/NetworkService'
import { capitalize } from 'lodash'

export default {
  name: 'signup-view',
  components: {
    FormPageTemplate,
    StudentForm,
    VolunteerForm,
    FormFooter
  },
  data() {
    return {
      userSelection: null,
      isReferred: false,
      referredBy: {},
      isLoginLinkVisible: true
    }
  },

  async created() {
    this.$store.dispatch('app/hideNavigation')
    const referralCode = this.$route.query.referral
    if (referralCode) {
      window.localStorage.setItem('upcReferredByCode', referralCode)
      this.isReferred = true

      const {
        data: { user }
      } = await NetworkService.getReferredBy(referralCode)

      if (!user) {
        this.isReferred = false
        window.localStorage.removeItem('upcReferredByCode')
      } else this.referredBy = user
    }

    if (this.$route.params)
      if (this.isMobileApp || this.$route.params.userType === 'student')
        this.userSelection = 'student'
      else if (this.$route.params.userType === 'volunteer')
        this.userSelection = 'volunteer'
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp
    }),
    welcomeMessage() {
      if (this.isReferred && this.referredBy)
        return `${this.firstName} invited you to UPchieve!`

      return 'Welcome to UPchieve!'
    },
    firstName() {
      if (this.referredBy && this.referredBy.firstname)
        return capitalize(this.referredBy.firstname)
      else return ''
    }
  },

  methods: {
    selectVolunteer() {
      this.$router.push('/sign-up/volunteer')
      this.userSelection = 'volunteer'
    },
    selectStudent() {
      this.$router.push('/sign-up/student')
      this.userSelection = 'student'
    },
    hideLoginLink() {
      this.isLoginLinkVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.uc-form-header {
  flex-direction: row-reverse;
}

.uc-subheader {
  color: $c-secondary-grey;
  font-weight: 600;
}

.uc-form-body {
  .uc-column {
    margin-top: 25px;
  }
}

.btn-container {
  margin-bottom: 25px;
  button:first-of-type {
    margin: 15px 0 15px;
  }
}

.uc-form-text--referred {
  margin-top: 2em;
}

.uc-form-button--referral {
  width: 300px;
}

.uc-form-button--link {
  display: inline-block;
  color: $c-soft-black;

  &:hover {
    color: #fff;
    text-decoration: none;
  }
}
</style>
