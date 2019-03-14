<template>
  <div id="app">
    <div class="nav-container">
      <sidebar />
    </div>
    <div class="col-xs-12 view-container">
      <router-view />
    </div>
  </div>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.css'
import './assets/styles/settings.css'

import Sidebar from './components/Sidebar'

import AuthService from './services/AuthService'

/**
 * @todo Examine this, huge code smell, refactoring might be needed
 */
AuthService.checkAuth() // {1}

export default {
  name: 'App',
  components: {
    Sidebar
  },
  created () {
    AuthService.checkAuth(this) // {1}
  }
}
</script>

<style>
/*
 * @todo {1} Make this truly responsive
 */
html,
body,
#app {
  height: 100%;
}

#app {
  font-family: 'Work Sans', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#app > .row,
.nav-container,
.view-container {
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
}

@media screen and (max-width: 700px) {
  /* {1} */
  /*------------------------------------------------------------------quickfix*/
  .nav-container {
    background: #000;
    width: 40px;
    overflow: hidden;
  }
  .col-xs-12.view-container {
    padding-left: 40px;
  }
  /*------------------------------------------------------------------quickfix*/
}
</style>
