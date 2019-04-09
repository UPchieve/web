<template>
  <div>
    <ul
      v-if="$route.path.indexOf('/onboarding') !== -1 && !user.isVolunteer"
      class="nav navbar-nav"
    >
      <router-link to="/onboarding/profile" tag="li">
        <a class="profile-info">Basic Profile</a>
      </router-link>
      <router-link to="/onboarding/academic" tag="li">
        <a class="profile-info">First Time Use Survey</a>
      </router-link>
    </ul>
    <ul
      v-else-if="$route.path.indexOf('/onboarding') !== -1"
      class="nav navbar-nav"
    >
      <router-link to="/onboarding/profile" tag="li">
        <a class="profile-info">Basic Profile</a>
      </router-link>
    </ul>
    <ul v-else-if="auth.authenticated" class="nav navbar-nav">
      <router-link to="/dashboard" tag="li">
        <a class="home icon">Home</a>
      </router-link>

      <template v-if="user.isVolunteer">
        <router-link to="/training" tag="li">
          <a class="training icon">Training</a>
        </router-link>
        <router-link to="/calendar" tag="li">
          <a class="schedule icon">Schedule</a>
        </router-link>
      </template>

      <template v-if="user.isAdmin">
        <router-link to="/edu" tag="li">
          <a class="resources icon">EDU Admin</a>
        </router-link>
      </template>

      <router-link to="/profile" tag="li">
        <a class="profile icon">Profile</a>
      </router-link>
      <router-link to="/resources" tag="li">
        <a class="resources icon">Useful Information</a>
      </router-link>
    </ul>
  </div>
</template>

<script>
import UserService from 'src/services/UserService'

export default {
  data () {
    const auth = UserService.getAuth()
    const user = UserService.getUser()
    const onboarding = UserService.getOnboarding()
    return {
      auth,
      user,
      onboarding
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
  font-weight: 600;
  color: #73737a;
  padding: 2px 0;
  height: 50px;
  line-height: 50px;
  display: flex;
  align-items: center;
  margin: auto 10px;
}

li > a:hover {
  background: none;
  text-decoration: none;
  color: #16d2aa;
}

li > a:focus {
  text-decoration: none;
  background: none;
}

li.active > a {
  color: #16d2aa;
}

li.active > a::before {
  fill: #16d2aa;
}

.icon::before {
  content: '';
  width: 20px;
  height: 20px;
  margin-right: 10px;
  margin-left: 20px;
  background-repeat: no-repeat;
  fill: #73737a;
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

.training.icon::before {
  background-image: url('../../assets/training_icon-01.svg');
}

.profile.icon::before {
  background-image: url('../../assets/profile_icon-01.svg');
}

.profile-info {
  padding-left: 20px;
}
</style>
