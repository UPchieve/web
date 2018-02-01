<template>
  <ul class="nav navbar-nav">
    <router-link to="/login" tag="li" v-if="!userauth.authenticated"><a class="login">Log In</a></router-link>
    <router-link to="/contact" tag="li"><a class="contact icon">Contact Us</a></router-link>
    <router-link to="/privacy" tag="li"><a class="privacy icon">Privacy Policy</a></router-link>
    <li v-if="userauth.authenticated"><a v-on:click="logout" class="logout icon">Logout</a></li>
    <li v-if="!userauth.authenticated"><a v-bind:href="mainWebsiteUrl">Back to Website</a></li>
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
  color: #73737A;
  padding: 2px 0;
  height: 50px;
  line-height: 50px;
  display: flex;
  margin: auto 10px;
  align-items: center;
}

li > a:hover {
  background: none;
  text-decoration: none;
  color: #16D2AA;
}

li > a:focus {
  text-decoration: none;
  background: none;
}

li.active > a {
  font-weight: bold;
  color: #16D2AA;
}

a.logout {
  cursor: pointer;
}

.icon::before {
  content: "";
  width: 20px;
  height: 20px;
  margin-right: 10px;
  margin-left: 20px;
  background-repeat: no-repeat;
}

.contact.icon::before {
  background-image: url('../../assets/contact_us_icon-01.svg');
}

.privacy.icon::before {
  background-image: url('../../assets/privacy_policy_icon-01.svg');
}

.logout.icon::before {
  background-image: url('../../assets/log_out_icon-01.svg');
}

.login {
  margin-left: 30px;
}

</style>
