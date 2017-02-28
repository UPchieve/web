<template>
  <div id="app">
      <div class="nav-container">
        <sidebar></sidebar>
      </div>
      <div class="col-xs-12 view-container">
        <router-view></router-view>
      </div>
    </div>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.css'

import Sidebar from './components/Sidebar'

import AuthService from './services/AuthService';

AuthService.checkAuth();

export default {
  name: 'app',
  components: {
    Sidebar
  },
  created(){
    AuthService.checkAuth(this);
  }
}
</script>

<style>

html, body, #app {
  height: 100%;
}

#app {
  font-family: 'Work Sans', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#app > .row, .nav-container, .view-container {
  height: 100%;
}

.nav-container {
  width: 300px;
  position: fixed;
  z-index: 1;
}

.col-xs-12.view-container {
  padding-left: 300px;
  padding-right: 0;
  z-index: 0;
}
</style>
