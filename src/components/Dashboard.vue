<template>
  <div class="dashboard">
    <div class="header-container">
      <div class="header">
        <h1>Welcome,<br />{{name}}.</h1>
      </div>
    </div>

  </div>
</template>

<script>

import UserService from 'src/services/UserService';

export default {
  data() {
    let user = UserService.getUser() || {};
    return {
      user: user,
      name: user.name || 'student'
    }
  },
}
</script>

<style scoped>
.header-container {
  height: 250px;
  background-color: #525666;
  position: relative;
}

.header-container::after {
  content: "";
  z-index: 2;
  display: inline-block;;
  width: 451px;
  height: 232px;
  background-image: url('../assets/dashboardHeader@2x.png');
  background-size: 451px 232px;
  position: absolute;
  bottom: 0px;
  right: 0;
}

.header {
  height: 210px;
  background-color: #64E1C6;
  padding-top: 83px;
  padding-left: 45px;
}

h1 {
  margin: 0;
  text-align: left;
  font-size: 36px;
  line-height: 42px;
}
</style>
