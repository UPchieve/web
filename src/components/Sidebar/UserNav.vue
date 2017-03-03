<template>
  <ul class="nav navbar-nav" v-if="auth.authenticated">
    <router-link to="/dashboard" tag="li"><a>Home</a></router-link>
    <template v-if="user.isVolunteer">
      <router-link to="/open-sessions" tag="li"><a>Open Sessions</a></router-link>
    </template>
    <template v-else>
      <router-link to="/session" tag="li"><a>Start Session</a></router-link>
    </template>

  </ul>
</template>

<script>

import UserService from '../../services/UserService';

export default {
  data() {
    let auth = UserService.getAuth(),
        user = UserService.getUser();
    return {
      auth: auth,
      user: user
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
</style>
