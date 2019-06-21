<template>
  <nav class="navbar">   
    <div v-on:click="$emit('closeMenu')"> 
      <router-link tag="h1" to="/" />
    </div>
    <div v-if="auth.authenticated">
      <profile-info v-if="auth.authenticated" />
      <div id="navbar" class="navbar-user">
        <user-nav v-on:closeMenu="$emit('closeMenu')" />
      </div>
    </div>
    <div v-else>
      <p class="aboutText">
        UPchieve is a volunteer-run ed-tech initiative with the goal of
        providing free, online, and on-demand educational and guidance services
        to disadvantaged students.
      </p>
    </div>
    <div class="navbar-footer">
      <sidebar-footer v-on:closeMenu="$emit('closeMenu')" />
    </div>
  </nav>
</template>

<script>
import UserService from '../services/UserService'

import UserNav from './Sidebar/UserNav'
import ProfileInfo from './Sidebar/ProfileInfo'
import Footer from './Sidebar/Footer'

export default {
  components: {
    UserNav,
    ProfileInfo,
    SidebarFooter: Footer // footer is reserved component name
  },
  data () {
    return {
      auth: UserService.getAuth()
    }
  },
}
</script>

<style scoped>
nav {
  height: 100%;
  border-radius: 0;
  border: none;

  background-color: #f6f6f6;
  color: #73737a;
  font-weight: 600;
}

.navbar {
    overflow: scroll;
    scroll-padding-bottom: 100px;
    display: flex;
    flex-direction: column;;
    justify-content: space-between;
    flex-basis: 100%;
}

h1,
h2 {
  font-weight: normal;
}

h1 {
  margin-top: 29px;
  margin-bottom: 50px;
  font-size: 24px;
  cursor: pointer;
}

h1::before {
  content: '';
  display: inline-block;
  width: 100px;
  height: 43px;
  background-image: url('../assets/logo-01.svg');
  background-size: 100px 43px;
  top: 0;
  left: 0;
}

.navbar-footer {
  margin-top: 25px;
}

p.aboutText {
  width: 250px;
  margin: auto;
  text-align: left;
}



@media screen and (max-width: 488px) {
  .navbar {
    height: 100vh !important;
    padding: 1.5em !important;
  }

  h1 {
    width: 100px !important;
    margin-left: auto !important;
    margin-right: auto !important;
    margin-top: 0em !important;
  }

  p.aboutText {
    width: 100% !important;
  }

  .navbar-footer {
    margin: 1em 0em !important;
  }

  .navbar-nav {
    margin: 0em !important;
  }
}
</style>
