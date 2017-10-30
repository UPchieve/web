<template>
  <div>
    <ul class="nav navbar-nav" v-if="$route.path.indexOf('/onboarding') !== -1 && !user.isVolunteer">
      <li v-bind:class="onboardingProfileClass"><a class="profile-info">Profile Information</a></li>
      <li v-bind:class="onboardingAcademicClass"><a>Academic Information</a></li>
      <li v-bind:class="onboardingCollegeClass"><a>College Counseling Information</a></li>
    </ul>
    <ul class="nav navbar-nav" v-else-if="$route.path.indexOf('/onboarding') !== -1">
      <li v-bind:class="onboardingProfileClass"><a class="profile-info">Profile Information</a></li>
    </ul>
    <ul class="nav navbar-nav" v-else-if="auth.authenticated">
      <router-link to="/dashboard" tag="li"><a class="home icon">Home</a></router-link>
      <template v-if="!user.isVolunteer">
        <router-link to="/session/math" tag="li"><a class="math icon">Get Math Tutoring</a></router-link>
        <router-link to="/session/college" tag="li"><a class="college icon">Get College Advice</a></router-link>
        <router-link to="/schedule" tag="li"><a class="schedule icon">Schedule a Session</a></router-link>
      </template>
      <router-link to="/resources" tag="li"><a class="resources icon">Resources</a></router-link>
      <router-link to="/calendar" tag="li"><a class="calendar icon">Calendar</a></router-link>
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
    align-items: center;
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

  .icon::before {
    content: "";
    width: 20px;
    height: 20px;
    margin-right: 10px;
    margin-left: 20px;
  }

  .home.icon::before {
    background-image: url('../../assets/home_icon-01.svg');
  }

  .math.icon::before {
    background-image: url('../../assets/math_icon-01.svg');
  }

  .college.icon::before {
    background-image: url('../../assets/college_icon-01.svg');
  }

  .schedule.icon::before {
    background-image: url('../../assets/calendar_icon-01.svg');
  }

  .resources.icon::before {
    background-image: url('../../assets/resources_icon-01.svg');
  }

  .profile-info {
    padding-left: 20px;
  }

</style>
