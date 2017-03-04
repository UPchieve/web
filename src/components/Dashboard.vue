<template>
  <div class="dashboard">
    <div class="header-container">
      <div class="header">
        <h1>Welcome,<br />{{name}}.</h1>
      </div>
    </div>
    <div class="dashboard-body row">
      <div class="col-lg-6">
        <h2>New to UPchieve?</h2>
        <p>Watch the video to learn how to use our services.</p>
        <div class="video">

        </div>
      </div>
      <div class="col-lg-6" v-if="!user.isVolunteer">
        <h2>Get started!</h2>
        <p>Our volunteers are here to help you.</p>
        <router-link to="/session/math" class="btn btn-lg btn-block">Get Math Tutoring</router-link>
        <router-link to="/session/college" class="btn btn-lg btn-block">Get College Admissions Advice</router-link>
        <router-link to="/schedule" class="btn btn-lg btn-block">Schedule an Admissions Consulting Session</router-link>
      </div>
      <div class="col-lg-6" v-else>
        <h2>Select a student to help</h2>
        <p> Only students who are waiting for a volunteer will show up below.</p>
        <list-sessions></list-sessions>
      </div>
    </div>
  </div>
</template>

<script>

import UserService from 'src/services/UserService';

import ListSessions from 'src/components/ListSessions';

export default {
  components: {
    ListSessions
  },
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
  padding: 20px 30px;
}

.dashboard-body h2 {
  font-size: 24px;
  font-weight: 600;
  text-align: left;
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

.btn {
  height: 60px;
  background-color: #16D2AA;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: white;
  line-height: 40px;
}

.btn:hover {
  background-color: #16D2AA;
}
</style>
