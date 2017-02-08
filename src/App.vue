<template>
  <div id="app">
    <navbar></navbar>
    <div class="container">
       <router-view></router-view>
    </div>
  </div>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.css'
import Navbar from './components/Navbar'

import AuthService from './services/AuthService';

AuthService.checkAuth();

export default {
  name: 'app',
  components: {
    Navbar
  },
  created(){
    AuthService.checkAuth(this);
  }
}
</script>

<style>

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
