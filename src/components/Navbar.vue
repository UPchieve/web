<template>
  <nav class="navbar navbar-default navbar-static-top">
    <div class="container">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <router-link to="/about" class="navbar-brand">BelieveAchieve</router-link>
      </div>
      <div id="navbar" class="navbar-collapse collapse">
        <ul class="nav navbar-nav">

          <router-link to="/about" tag="li"><a>About</a></router-link>
          <router-link to="/login" tag="li" v-if="!authenticated"><a>Login</a></router-link>
          <router-link to="/signup" tag="li" v-if="!authenticated"><a>Signup</a></router-link>
          <li v-if="authenticated"><a v-on:click="logout" class="logout">Logout</a></li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>

import AuthService from '../services/AuthService';

export default {
  data() {
    return {
      authenticated: AuthService.isAuthenticated
    }
  },
  methods: {
    logout(){
      AuthService.logout();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

a.logout {
  cursor: pointer;
}
</style>
