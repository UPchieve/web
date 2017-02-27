<template>
  <ul class="nav navbar-nav">
    <router-link to="/signup" tag="li" v-if="!user.authenticated"><a>Signup</a></router-link>
    <router-link to="/whiteboard" tag="li" v-if="user.authenticated"><a>Whiteboard</a></router-link>
    <router-link to="/messager" tag="li" v-if="user.authenticated"><a>Chat</a></router-link>
  </ul>
</template>

<script>

import AuthService from '../../services/AuthService';

export default {
  components: {

  },
  data() {
    return {
      user: AuthService.user
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
    margin-bottom: 16px;
  }

  li > a {
    color: white;
    padding: 2px 0;
  }

  li > a:hover {
    background: none;
    text-decoration: underline;
  }

  li > a:focus {
    text-decoration: none;
    background: none;
  }

  li.active > a {
    font-weight: bold;
  }

  a.logout {
    cursor: pointer;
  }
</style>
