<template>
  <ul class="nav navbar-nav">
    <router-link to="/login" tag="li" v-if="!userauth.authenticated"><a>Log In</a></router-link>
    <router-link to="/contact" tag="li">
      <a><div class="contact-icon icon"></div><span>Contact Us</span></a>
    </router-link>
    <router-link to="/privacy" tag="li">
      <a><div class="privacy-icon icon"></div><span>Privacy Policy</span></a>
    </router-link>
    <li v-if="userauth.authenticated">
      <a v-on:click="logout" class="logout"><div class="logout-icon icon"></div><span>Logout</span></a>
    </li>
    <li v-if="!userauth.authenticated">
      <a v-bind:href="mainWebsiteUrl"><div class="icon"></div><span>Back to Website</span></a>
    </li>
  </ul>
</template>

<script>

import UserService from '../../services/UserService';
import AuthService from '../../services/AuthService';

export default {
  components: {

  },
  data() {
    return {
      userauth: UserService.getAuth(),
      mainWebsiteUrl: process.env.MAIN_WEBSITE_URL
    }
  },
  methods: {
    logout(){
      AuthService.logout(this);
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
  color: white;
  padding: 2px 0;
  height: 50px;
  line-height: 50px;
  display: flex;
  margin: auto 10px;
  align-items: center;
  background-color: #263368;
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
  font-weight: bold;
  background-color: #263368;
  margin: auto 10px;
}

a.logout {
  cursor: pointer;
}

.icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  margin-left: 20px;
}

.contact-icon {
  background-image: url('../../assets/contact_us_icon-01.svg');
}

.privacy-icon {
  background-image: url('../../assets/privacy_policy_icon-01.svg');
}

.logout-icon {
  background-image: url('../../assets/log_out_icon-01.svg');
}

</style>
