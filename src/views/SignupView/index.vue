<template>
  <div
    v-if="
      (useNewSignUpFlow ||
        $route.query.partner === 'great-schools' ||
        $route.params.studentPartnerOrgKey === 'great-schools') &&
      this.userSelection === UserType.student
    "
    class="h-full"
  >
    <sign-up-forms :getPageDetails="getStudentPageDetails" />
  </div>
  <div v-else-if="this.userSelection === UserType.teacher" class="h-full">
    <sign-up-forms :getPageDetails="getTeacherPageDetails" />
  </div>
  <div
    v-else-if="
      this.userSelection === UserType.volunteer &&
      isNewVolunteerSignUpFlowEnabled
    "
    class="h-full"
  >
    <sign-up-forms :getPageDetails="getVolunteerPageDetails" />
  </div>
  <form-page-template v-else :formCardMaxWidth="'660px'">
    <div class="uc-form">
      <volunteer-form
        v-if="
          this.userSelection === 'volunteer' && !isNewVolunteerSignUpFlowEnabled
        "
      />
      <student-form v-else-if="this.userSelection === 'student'" />

      <loader
        v-else-if="isCheckingReferral"
        class="uc-row justify-center"
      ></loader>
      <div v-else>
        <h1 class="uc-form-header">{{ welcomeMessage }}</h1>
        <p v-if="isReferredByStudent" class="uc-form-text">
          UPchieve is a nonprofit that provides 100% free online tutoring and
          college counseling, available 24/7! Check if you are eligible!
        </p>
        <p v-else-if="isReferredByVolunteer" class="uc-form-text">
          UPchieve is a nonprofit that provides 100% free online tutoring and
          college counseling to low income students in the U.S.
          <br /><br />
          Sign up as a tutor to help low income students succeed in school and
          beyond!
        </p>
        <p v-else class="uc-form-text">
          We are a nonprofit that provides free, online tutoring and college
          counseling to eligible middle and high school students.
        </p>

        <div v-if="isReferredByStudent" class="uc-column items-center">
          <button
            class="uc-form-button"
            type="submit"
            @click.prevent="selectStudent()"
          >
            Check my eligibility
          </button>

          <a
            target="_blank"
            rel="noopener noreferrer"
            class="link"
            href="https://upchieve.org/students"
            >Tell me more about UPchieve first
          </a>
        </div>
        <div v-else-if="isReferredByVolunteer" class="uc-column items-center">
          <button
            class="uc-form-button"
            type="submit"
            @click.prevent="selectVolunteer()"
          >
            I'm ready to tutor!
          </button>

          <a
            target="_blank"
            rel="noopener noreferrer"
            class="link"
            href="https://upchieve.org/volunteer-with-us"
            >Tell me more about UPchieve first
          </a>
        </div>
        <div v-else>
          <p class="uc-form-text bold">I want to sign up as a...</p>
          <div class="btn-card-container">
            <button
              v-if="!isDisableStudentSignupsEnabled"
              data-testid="studentCard"
              class="btn-card student"
              @click.prevent="selectStudent"
              type="button"
            >
              <div class="img-container">
                <student-avatar class="img"></student-avatar>
              </div>
              <p class="text">Student</p>
            </button>
            <button
              data-testid="volunteerCard"
              class="btn-card volunteer"
              @click.prevent="selectVolunteer"
              type="button"
            >
              <div class="img-container">
                <volunteer-avatar class="img"></volunteer-avatar>
              </div>
              <p class="text">Volunteer</p>
            </button>
            <button
              data-testid="teacherCard"
              class="btn-card teacher"
              @click.prevent="selectTeacher"
              type="button"
            >
              <div class="img-container">
                <teacher-avatar class="img"></teacher-avatar>
              </div>
              <p class="text">Teacher</p>
            </button>
          </div>
        </div>
        <p class="uc-form-text">
          Already have an account?
          <router-link class="uc-link" to="/login">Log In</router-link>
        </p>
        <p v-if="downtimeBannerMessage" class="downtime-msg">
          Note: {{ downtimeBannerMessage }}
        </p>
      </div>
    </div>
  </form-page-template>
</template>

<script>
import { mapGetters } from 'vuex'
import { capitalize } from 'lodash-es'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import Loader from '@/components/Loader.vue'
import SignUpForms from './SignUpForms.vue'
import StudentForm from './StudentForm.vue'
import VolunteerForm from './VolunteerForm.vue'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import { UserType } from '@/services/SignUpService/types'
import { getPageDetails as getStudentPageDetails } from '@/services/SignUpService/StudentSignUpService'
import { getPageDetails as getTeacherPageDetails } from '@/services/SignUpService/TeacherSignUpService'
import { getPageDetails as getVolunteerPageDetails } from '@/services/SignUpService/VolunteerSignUpService'
import StudentAvatar from '@/assets/user_avatars/student-avatar.svg'
import VolunteerAvatar from '@/assets/user_avatars/volunteer-avatar.svg'
import TeacherAvatar from '@/assets/user_avatars/teacher-avatar.svg'
import { EVENTS } from '@/consts'

export default {
  name: 'signup-view',
  components: {
    FormPageTemplate,
    Loader,
    SignUpForms,
    StudentForm,
    VolunteerForm,
    StudentAvatar,
    VolunteerAvatar,
    TeacherAvatar,
  },
  data() {
    return {
      userSelection: null,
      isCheckingReferral: false,
      referredBy: {},
      UserType,
      getStudentPageDetails,
      getTeacherPageDetails,
      getVolunteerPageDetails,
    }
  },

  async created() {
    const referralCode = this.$route.query.referral
    if (referralCode) {
      this.isCheckingReferral = true

      try {
        const {
          data: { user },
        } = await NetworkService.getReferredBy(referralCode)
        if (!user) {
          AnalyticsService.captureEvent(
            EVENTS.USER_VISITED_INCORRECT_REFERRAL_LINK,
            {
              referralCode,
            }
          )
        } else {
          this.referredBy = user
          window.localStorage.setItem('upcReferredByCode', referralCode)
          AnalyticsService.captureEvent(EVENTS.USER_VISITED_REFERRAL_LINK, {
            referralCode,
            userType: this.referredBy.userType,
          })
        }
      } finally {
        this.isCheckingReferral = false
      }
    }
    if (this.$route.params.inviteCode) {
      localStorage.setItem('joinedTeamCode', this.$route.params.inviteCode)
    }

    this.userSelectionFrom(this.$route.params)
  },
  beforeRouteUpdate(to, _from, next) {
    this.userSelectionFrom(to.params)
    next()
  },

  computed: {
    ...mapGetters({
      useNewSignUpFlow: 'featureFlags/useNewSignUpFlow',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      isDisableStudentSignupsEnabled:
        'featureFlags/isDisableStudentSignupsEnabled',
      isNewVolunteerSignUpFlowEnabled:
        'featureFlags/isNewVolunteerSignUpFlowEnabled',
    }),
    welcomeMessage() {
      if (this.referredBy?.firstName)
        return `${capitalize(this.referredBy.firstName)} invited you to UPchieve!`

      return 'Welcome to UPchieve!'
    },
    isReferredByStudent() {
      return this.referredBy.userType === this.UserType.student
    },
    isReferredByVolunteer() {
      return this.referredBy.userType === this.UserType.volunteer
    },
  },

  methods: {
    userSelectionFrom(routeParams) {
      if (routeParams.userType === this.UserType.student)
        this.userSelection = this.UserType.student
      else if (routeParams.userType === this.UserType.volunteer)
        this.userSelection = this.UserType.volunteer
      else if (routeParams.userType === this.UserType.teacher)
        this.userSelection = this.UserType.teacher
      else this.userSelection = null
    },
    selectVolunteer() {
      this.$router.push('/sign-up/volunteer/account')
      this.userSelection = 'volunteer'
    },
    selectStudent() {
      this.$router.push('/sign-up/student/eligibility')
      this.userSelection = 'student'
    },
    selectTeacher() {
      this.$router.push('/sign-up/teacher/eligibility')
      this.userSelection = 'teacher'
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
  font-size: 16px;
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
      background: $c-volunteer;
    }
  }

  &.student {
    .img-container {
      background: $c-student;
    }
  }

  &.teacher {
    .img-container {
      background: $c-teacher;
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

.downtime-msg {
  background-color: $c-warning-orange;
  border-radius: 8px;
  color: white;
  text-align: center;
  padding: 8px;
  margin-top: 16px;
}
</style>
