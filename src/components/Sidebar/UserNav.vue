<template>
  <div>
    <ul class="nav navbar-nav" v-if="$route.path.indexOf('/onboarding') !== -1 && !user.isVolunteer">
      <li v-bind:class="onboardingProfileClass"><a>Profile Information</a></li>
      <li v-bind:class="onboardingAcademicClass"><a>Academic Information</a></li>
      <li v-bind:class="onboardingCollegeClass"><a>College Counseling Information</a></li>
    </ul>
    <ul class="nav navbar-nav" v-else-if="$route.path.indexOf('/onboarding') !== -1">
      <li v-bind:class="onboardingProfileClass"><a>Profile Information</a></li>
    </ul>
    <ul class="nav navbar-nav" v-else-if="auth.authenticated">
      <router-link to="/dashboard" tag="li">
        <a><div class="home-icon icon"></div><span>Home</span></a>
      </router-link>
      <template v-if="!user.isVolunteer">
        <router-link to="/session/math" tag="li">
          <a><div class="math-icon icon"></div><span>Get Math Tutoring</span></a>
        </router-link>
        <router-link to="/session/college" tag="li">
          <a><div class="college-icon icon"></div><span>Get College Advice</span></a>
        </router-link>
        <router-link to="/schedule" tag="li">
          <a><div class="schedule-icon icon"></div><span>Schedule a Session</span></a>
        </router-link>
      </template>
      <router-link to="/resources" tag="li">
        <a><div class="resources-icon icon"></div><span>Resources</span></a>
      </router-link>
    </ul>
  </div>
</template>

<script>

import UserService from 'src/services/UserService'
import OnboardingService from 'src/services/OnboardingService'

export default {
  data() {
    let auth = UserService.getAuth(),
        user = UserService.getUser(),
        onboarding = UserService.getOnboarding();
    return {
      auth, user, onboarding,

      onboardingProfileClass: {
        disabled: false
      }
    }
  },
  computed: {
    onboardingAcademicClass() {
      return {
        disabled: this.$route.path.indexOf('/onboarding/profile') !== -1
      }
    },
    onboardingCollegeClass() {
      return {
        disabled: this.$route.path.indexOf('/onboarding/profile') !== -1 || this.$route.path.indexOf('/onboarding/academic') !== -1
      }
    }
  }
}
</script>

<style scoped>
  .navbar-nav {
    width: 100%;
    margin-top: 38px;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    width: 100%;
    height: 50px;
  }

  li > a {
    font-size: 16px;
    font-weight: 400;
    color: white;
    padding: 2px 0;
    height: 50px;
    line-height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #263368;
    margin: auto 10px;
  }

  li > a:hover {
    background: none;
    text-decoration: underline;
  }

  li > a:focus {
    text-decoration: none;
    background: none;
  }

  li.active {
    background-color: #16D2AA;
  }

  li.active > a {
      background-color: #263368;
      margin: auto 10px;
  }

  .icon {
    width: 20px;
    height: 20px;
    margin-right: 10px;
  }

  .home-icon {
    background-image: url('../../assets/home_icon-01.svg');
  }

  .math-icon {
    background-image: url('../../assets/math_icon-01.svg');
  }

  .college-icon {
    background-image: url('../../assets/college_icon-01.svg');
  }

  .schedule-icon {
    background-image: url('../../assets/calendar_icon-01.svg');
  }

  .resources-icon {
    background-image: url('../../assets/resources_icon-01.svg');
  }

</style>
