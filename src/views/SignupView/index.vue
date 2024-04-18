<template>
  <div
    v-if="useNewSignUpFlow && this.userSelection === 'student'"
    class="h-full"
  >
    <sign-up-forms />
  </div>
  <form-page-template v-else>
    <div class="uc-form">
      <volunteer-form v-if="this.userSelection === 'volunteer'" />
      <student-form v-else-if="this.userSelection === 'student'" />

      <div v-else>
        <h1 class="uc-form-header">{{ welcomeMessage }}</h1>
        <p v-if="isReferred" class="uc-form-text">
          UPchieve is a nonprofit that provides <b>100% free</b> online tutoring
          and college counseling, available 24/7! Since {{ firstName }} invited
          you, you can skip our wait list!
        </p>
        <p v-else class="uc-form-text">
          We are a nonprofit that provides free, online tutoring and college
          counseling to eligible middle and high school students.
        </p>

        <div v-if="isReferred" class="uc-column items-center">
          <button
            class="uc-form-button"
            type="submit"
            @click.prevent="selectStudent()"
          >
            Awesome! I'm ready to sign up
          </button>

          <a
            target="_blank"
            rel="noopener noreferrer"
            class="link"
            href="https://upchieve.org/students"
            >Tell me more about UPchieve first
          </a>
        </div>
        <div v-else>
          <p class="uc-form-text bold">I want to sign up as...</p>
          <div class="btn-card-container">
            <button
              data-testid="studentCard"
              class="btn-card student"
              @click.prevent="selectStudent"
            >
              <div class="img-container">
                <student-avatar class="img"></student-avatar>
              </div>
              <p class="text">A Student</p>
            </button>
            <button
              data-testid="volunteerCard"
              class="btn-card volunteer"
              @click.prevent="selectVolunteer"
            >
              <div class="img-container">
                <volunteer-avatar class="img"></volunteer-avatar>
              </div>
              <p class="text">An Academic Coach</p>
            </button>
          </div>
        </div>
        <p class="uc-form-text">
          Already have an account?
          <router-link class="uc-link" to="/login">Log In</router-link>
        </p>
      </div>
    </div>
  </form-page-template>
</template>

<script>
import { mapGetters } from 'vuex'
import { capitalize } from 'lodash-es'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import SignUpForms from './SignUpForms.vue'
import StudentForm from './StudentForm.vue'
import VolunteerForm from './VolunteerForm.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import StudentAvatar from '@/assets/student-avatar.svg'
import VolunteerAvatar from '@/assets/volunteer-avatar.svg'
import { EVENTS } from '@/consts'

export default {
  name: 'signup-view',
  components: {
    FormPageTemplate,
    SignUpForms,
    StudentForm,
    VolunteerForm,
    StudentAvatar,
    VolunteerAvatar,
  },
  data() {
    return {
      userSelection: null,
      isReferred: false,
      referredBy: {},
    }
  },

  async created() {
    this.$store.dispatch('app/hideNavigation')

    const referralCode = this.$route.query.referral
    if (referralCode) {
      window.localStorage.setItem('upcReferredByCode', referralCode)
      AnalyticsService.captureEvent(EVENTS.USER_VISITED_REFERRAL_LINK, {
        referralCode,
      })
      this.isReferred = true

      const {
        data: { user },
      } = await NetworkService.getReferredBy(referralCode)

      if (!user) {
        this.isReferred = false
        window.localStorage.removeItem('upcReferredByCode')
      } else this.referredBy = user
    }

    if (this.$route.params)
      if (this.$route.params.userType === 'student')
        this.userSelection = 'student'
      else if (this.$route.params.userType === 'volunteer')
        this.userSelection = 'volunteer'
  },
  computed: {
    ...mapGetters({
      useNewSignUpFlow: 'featureFlags/useNewSignUpFlow',
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
    },
  },

  methods: {
    selectVolunteer() {
      this.$router.push('/sign-up/volunteer')
      this.userSelection = 'volunteer'
    },
    selectStudent() {
      this.$router.push('/sign-up/student/eligibility')
      this.userSelection = 'student'
    },
  },
}
</script>

<style lang="scss" scoped>
.uc-form-header {
  display: block;
  font-size: 36px;
  text-align: center;
}

.uc-form-text {
  margin-top: 25px;
  text-align: center;

  &.bold {
    font-weight: 500;
  }
}

.btn-card-container {
  @include flex-container(row, space-evenly);
  margin: 40px 0;

  @include breakpoint-below('small') {
    @include flex-container(column, center, center);
    @include child-spacing(top, 15px);
    margin: 20px 0;
  }
}

.btn-card {
  @include flex-container(column, space-between);
  background: white;
  border: none;
  border-radius: 8px;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.2);
  height: 160px;
  overflow: hidden;
  padding: 0;
  position: relative;
  top: 0;
  transition: top 0.2s ease-in-out;
  width: 170px;

  &:hover {
    top: -5px;
  }

  &.volunteer {
    .img-container {
      background: #a5e9ff;

      .img {
        height: 85%;
        top: 8px;
      }
    }
  }

  &.student {
    .img-container {
      background: #f9bef9;
    }
  }

  .img-container {
    flex-grow: 1;
    position: relative;
    width: 100%;

    .img {
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }
  }

  .text {
    background: white;
    font-size: 14px;
    font-weight: 500;
    padding: 10px;
    margin: 0;
    width: 100%;
  }
}

a.link {
  color: $c-information-blue;
  font-size: 18px;
  font-weight: 500;
  margin: 20px 0 50px 0;
  text-align: center;

  &:hover {
    color: #103a90;
    text-decoration: none;
  }
}
</style>
