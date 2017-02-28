<template>
  <ul class="nav navbar-nav">
    <router-link to="/contact" tag="li"><a>Contact Us</a></router-link>
    <router-link to="/privacy" tag="li"><a>Privacy Policy</a></router-link>
    <li v-if="userauth.authenticated"><a v-on:click="logout" class="logout">Logout</a></li>
    <router-link to="/login" tag="li" v-if="!userauth.authenticated"><a>Login</a></router-link>
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
      userauth: UserService.getAuth()
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
</style>
