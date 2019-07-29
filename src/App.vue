<template>
  <div id="app">
    <div v-if="!$route.meta.hideSidebar" class="sidebar-wrapper">
      <!-- Sidebar -->
      <div
        class="nav-container"
        v-bind:class="{ forMobileMode: mobileMode, active: isActive }"
      >
        <sidebar v-on:closeMenu="closeMenu()" />
      </div>

      <!-- Sidebar button -->
      <div class="toggleMenu forMobileView">
        <button
          v-if="!isActive"
          @click="toggleMenu()"
          class="sidebar-hamburger"
          v-bind:class="{ white: $route.name === 'DashboardView' }"
        />

        <button v-else @click="toggleMenu()" class="sidebar-exit" />
      </div>

      <!-- Router view -->
      <div class="col-xs-12 view-container">
        <error-feedback>
          <router-view />
        </error-feedback>
      </div>
    </div>

    <router-view v-else />
  </div>
</template>

<script>
import "./scss/main.scss";
import Sidebar from "./components/Sidebar";
import ErrorFeedback from "./components/ErrorFeedback";
import AuthService from "./services/AuthService";

const MOBILE_MODE_WIDTH = 700;

/**
 * @todo Examine this, huge code smell, refactoring might be needed
 */
AuthService.checkAuth(); // {1}

export default {
  name: "App",
  components: {
    Sidebar,
    ErrorFeedback
  },
  created() {
    AuthService.checkAuth(this); // {1}

    // Update mobileMode on window resize
    window.addEventListener("resize", () => {
      this.mobileMode = window.innerWidth <= MOBILE_MODE_WIDTH;
    });
  },
  data() {
    return {
      mobileMode: window.innerWidth <= MOBILE_MODE_WIDTH,
      isActive: false
    };
  },
  methods: {
    toggleMenu() {
      this.isActive = !this.isActive;
    },
    closeMenu() {
      if (this.mobileMode) {
        this.isActive = false;
      }
    }
  }
};
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
#app,
#app > .row,
.nav-container,
.view-container,
.sidebar-wrapper {
  height: 100%;
}

#app {
  font-family: $default-font;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
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

@media screen and (max-width: 700px) {
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
    background: url("./assets/tealHamburgerMenu.png") !important;
    background-size: auto 100% !important;
    background-position: top left !important;
    background-repeat: no-repeat !important;
    border: none !important;
  }
  .sidebar-hamburger.white {
    background: url("./assets/whiteHamburgerMenu.png") !important;
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
    background: url("./assets/exitMenuIcon.png") !important;
    background-size: auto 100% !important;
    background-position: top left !important;
    background-repeat: no-repeat !important;
    border: none !important;
  }

  .nav-container.forMobileMode {
    margin-left: -100% !important;
    width: 80vw !important;
    z-index: 20 !important;
    transition: margin-left 0.3s linear;
    /* display: none !important; */
  }

  .nav-container.forMobileMode.active {
    margin-left: 0% !important;
  }

  .col-xs-12.view-container {
    padding-left: 0px !important;
  }
}
</style>
