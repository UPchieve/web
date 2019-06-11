<template>
  <div id="app">

    <div v-if="['LoginForm', 'Logout', 'Registration', 'ResetPasswordForm', 'SetPasswordForm', 'Session-math', 'Session-college'].indexOf($route.name) > -1">
    </div>

    <div v-else class="toggleMenu forMobileView">
      <button 
        v-if="!isActive" 
        @click="toggleMenu()" 
        class="sidebar-hamburger" 
        v-bind:class="{white: ['Dashboard'].indexOf($route.name) > -1}"
      />
  
      <button v-else  @click="toggleMenu()" class="sidebar-exit" />
    </div>
    
      <div v-if="!mobileMode"  class="nav-container">
        <sidebar v-on:closeMenu="doNothing()" />
      </div>

      <div v-else class="nav-container forMobileMode" v-bind:class="{active: isActive}">
        <sidebar v-on:closeMenu="closeMenu()" />
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

    if (window.innerWidth <= 488) {
      this.mobileMode = true   
    } else {
      this.mobileMode = false
    }
  },
  data () {
    return {
      mobileMode: false,
      isActive: false
    }
  },
  methods: {
    toggleMenu() {
        this.isActive = !this.isActive
    },
    closeMenu() {
        this.isActive = false
    },
    doNothing() {
      return
    }
  }
}
</script>

<style lang="scss">
/*
 * @todo {1} Make this truly responsive
 */


.toggleMenu.forMobileView {
  display: none;
}

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

.toggleMenu {
  display: none;
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



@media screen and (max-width: 488px) {
  .toggleMenu.forMobileView {
    display: block !important;
    position: absolute !important;
    top: 2em !important;
    left: 1em !important;
    z-index: 500 !important;
  }

  .sidebar-hamburger,
  .sidebar-exit {
    outline: none !important;
  }

  .sidebar-hamburger {
    width: 2em !important;
    height: 1.5em !important;
    margin: 0em 0em 0em 0.5em !important;
    background: url('./assets/tealHamburgerMenu.png') !important;
    background-size: auto 100% !important;
    background-position: top left !important;
    background-repeat: no-repeat !important;
    border: none !important;
  }
  .sidebar-hamburger.white {
    background: url('./assets/whiteHamburgerMenu.png') !important;
    background-size: auto 100% !important;
    background-position: top left !important;
    background-repeat: no-repeat !important;
    border: none !important;
  }

  .sidebar-exit {
    width: 1.5em !important;
    height: 1.5em !important;
    position: fixed !important;
    /* margin-top: 1em !important; */
    background: url('./assets/exitMenuIcon.png') !important;
    background-size: auto 100% !important;
    background-position: top left !important;
    background-repeat: no-repeat !important;
    border: none !important;
  }

  .nav-container.forMobileMode {
    margin-left: -100% !important;
    width: 80vw !important;
    z-index: 20 !important;
    transition: all 0.3s linear;
    /* display: none !important; */
  }

  .nav-container.forMobileMode.active {
     margin-left: 0% !important;
     transition: all 0.3s linear;
  }

  .col-xs-12.view-container {
    padding-left: 0px !important;
  }
}
</style>
