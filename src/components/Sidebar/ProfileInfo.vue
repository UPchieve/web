<template>
  <div class="profile-info">
    <div class="avatar"></div>
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
    console.log(user);
    return {
      user: user,
      name: user.name || 'student'
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
    background-image: url('../../assets/defaultavatar.png')
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
