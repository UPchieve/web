<template>
  <div class="profile-info">
    <div class="avatar"></div>
    <p class="greeting">Hello, student!</p>
    <a class="edit-profile">Edit profile</a>
  </div>
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
