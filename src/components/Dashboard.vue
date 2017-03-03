<template>
  <div class="dashboard">
    <div class="header-container">
      <div class="header">
        <h1>Welcome,<br />{{name}}.</h1>
      </div>
    </div>
    <div class="dashboard-body row">
      <div class="col-md-6">
        <h2>New to UPchieve?</h2>
        <p>Watch the video to learn how to use our services.</p>
        <div class="video">

        </div>
      </div>
      <div class="col-md-6">
        <h2>Get started!</h2>
        <p>Our volunteers are here to help you.</p>
        <a href="#">Start a new session</a>
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
  font-weight: 400;
}

.dashboard-body {
  padding: 40px 30px;
}

.dashboard-body h2 {
  font-size: 24px;
  font-weight: 600;
  text-align: left;
  margin-top: 0;
}

.dashboard-body p {
  font-size: 16px;
  font-weight: 300;
  color: #333333;
  text-align: left;
}

.video {
  width: 450px;
  height: 264px;
  background-color: #EEEEEE;
}
</style>
