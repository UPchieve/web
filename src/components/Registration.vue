<template>
  <div class="registration-container background">
    <div class="form-register">
      <div v-if="this.userSelection === 'none'">
        <div class="header">
          <router-link to="login" class="login-link">Log In</router-link>
          <div class="registration-header">Register an Account</div>
        </div>
        <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="selectStudent()">STUDENT</button>
        <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="selectVolunteer()">VOLUNTEER</button>
      </div>
      <volunteer-form v-else-if="this.userSelection === 'volunteer'"></volunteer-form>
      <student-form v-else></student-form>
    </div>
  </div>
</template>

<script>

import StudentForm from './Registration/StudentForm';
import VolunteerForm from './Registration/VolunteerForm';

export default {
  components: {
    StudentForm,
    VolunteerForm
  },
  data(){
    return {
      userSelection: 'none'
    };
  },
  methods: {
    selectVolunteer() {
      this.userSelection = 'volunteer';
    },
    selectStudent() {
      this.userSelection = 'student';
    }
  }
}
</script>

<style scoped>

.registration-container {
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 50px;
  margin-top: 65px;
}

.login-link {
  color: #73737A;
  font-weight: 600;
}

.registration-header {
  color: #16D2AA;
  font-weight: 600;
}

.background {
  display: flex;
  background-image: url('../assets/onboarding_background.png');
  background-size: cover;
  height: 100%;
  font-size: 16px;
  margin-left: -300px;
  position: relative;
  z-index: 2;
}

.form-register {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 500px;
  height: 500px;
  margin: auto;
  background-color: white;
  padding: 0px 75px;
}

button[type="submit"] {
  background-color: #F6F6F6;
  border: none;
  font-weight: 600;
  color: #16D2AA;
  height: 40px;
  border-radius: 20px;
  font-size: 12px;
  margin-bottom: 10px;
}

button[type="submit"]:hover, button[type="submit"]:active {
  color: white;
  background-color: #16D2AA;
}

</style>
