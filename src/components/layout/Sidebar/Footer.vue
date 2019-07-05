<template>
  <ul class="nav navbar-nav">
    <div v-on:click="$emit('closeMenu')">
      <router-link v-if="!userauth.authenticated" to="/login" tag="li"
        ><a class="login">Log In</a></router-link
      >
    </div>

    <div v-on:click="$emit('closeMenu')">
      <router-link to="/contact" tag="li"
        ><a class="contact icon" >Contact Us</a></router-link
      >
    </div>

    <div v-on:click="$emit('closeMenu')">
      <router-link to="/legal" tag="li"
        ><a class="privacy icon" v-on:click="$emit('closeMenu')">Legal Policy</a></router-link
      >
    </div>

    <div v-on:click="$emit('closeMenu')">
      <li v-if="userauth.authenticated" v-on:click="$emit('closeMenu')">
        <a class="logout icon" @click="logout">Logout</a>
      </li>
    </div>

    <div v-on:click="$emit('closeMenu')">
      <li v-if="!userauth.authenticated" v-on:click="$emit('closeMenu')">
        <a :href="mainWebsiteUrl">Back to Website</a>
      </li>
    </div>
  </ul>
</template>

<script>
import UserService from 'src/services/UserService'
import AuthService from 'src/services/AuthService'

export default {
  components: {},
  data () {
    return {
      userauth: UserService.getAuth(),
      mainWebsiteUrl: process.env.MAIN_WEBSITE_URL
    }
  },
  methods: {
    logout () {
      AuthService.logout(this)
    }
  }
}
</script>

<style lang="scss" scoped>
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
  color: #73737a;
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
  color: #16d2aa;
}

li > a:focus {
  text-decoration: none;
  background: none;
}

li.active > a {
  font-weight: bold;
  color: #16d2aa;
}

a.logout {
  cursor: pointer;
}

.icon::before {
  content: '';
  width: 20px;
  height: 20px;
  margin-right: 10px;
  margin-left: 20px;
  background-repeat: no-repeat;
}

.contact.icon::before {
  background-image: url('~src/assets/contact_us_icon-01.svg');
}

.privacy.icon::before {
  background-image: url('~src/assets/privacy_policy_icon-01.svg');
}

.logout.icon::before {
  background-image: url('~src/assets/log_out_icon-01.svg');
}

.login {
  margin-left: 30px;
}
</style>
