<template>
  <div class="profile-info">
    <div class="avatar" v-bind:style="avatarStyle"></div>
    <p class="greeting">Hello, {{name}}!</p>
    <router-link to="/profile" class="edit-profile">Edit profile</router-link>
  </div>
</template>

<script>

import UserService from '../../services/UserService';

export default {
  components: {

  },
  data() {
    let user = UserService.getUser() || {};

    var avatarUrl = user.picture || 'static/defaultavatar.png';
    return {
      user: user,
      name: user.name || 'student',
      avatarStyle: {
        backgroundImage: `url(${avatarUrl})`
      }
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
  .avatar {
    display: block;
    width: 60px;
    height: 60px;
    margin: 0 auto;
    background-size: cover;
  }

  .greeting {
    margin-top: 12px;
    margin-bottom: 0;
    font-size: 16px;
  }

  .edit-profile {
    font-size: 12px;
    color: white;
  }


</style>
