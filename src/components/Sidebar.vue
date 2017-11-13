<template>
  <nav class="navbar">
    <router-link tag="h1" to="/"></router-link>
    <div v-if="auth.authenticated">
      <profile-info v-if="auth.authenticated"></profile-info>
      <div id="navbar">
        <user-nav></user-nav>
      </div>
    </div>
    <div v-else>
      <p class="aboutText">UPchieve is a volunteer-run ed-tech initiative with the goal of providing free, online, and on-demand educational and guidance services to disadvantaged students.</p>
    </div>
    <div class="navbar-footer">
      <sidebar-footer></sidebar-footer>
    </div>
  </nav>
</template>

<script>

import UserService from '../services/UserService';

import UserNav from './Sidebar/UserNav';
import ProfileInfo from './Sidebar/ProfileInfo';
import Footer from './Sidebar/Footer';

export default {
  components: {
    UserNav,
    ProfileInfo,
    SidebarFooter: Footer // footer is reserved component name
  },
  data() {
    return {
      auth: UserService.getAuth()
    }
  }
}
</script>

<style scoped>
nav {
  height: 100%;
  border-radius: 0;
  border: none;

  background-color: #263368;
  color: white;
}

h1, h2 {
  font-weight: normal;
}

h1 {
  margin-top: 29px;
  margin-bottom: 50px;
  font-size: 24px;
  cursor: pointer;
}

h1::before {
  content: "";
  display: inline-block;;
  width: 120px;
  height: 50px;
  background-image: url('../assets/logo.png');
  background-size: 120px 50px;
  top: 0;
  left: 0;
}

.navbar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

p.aboutText {
  width: 250px;
  margin: auto;
  text-align: left;
}

</style>
