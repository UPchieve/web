<template>
  <div class="registration-container background">
    <div class="form-register">
      <sig
      <code-form v-if="!validRegistrationCode"></code-form>
      <signup-form v-else></signup-form>
      <div class="footer">
        <router-link to="/contact" tag="div"><a class="contact icon" target="_blank">CONTACT US</a></router-link>
        <router-link to="/legal" tag="div"><a class="privacy icon" target="_blank">LEGAL POLICY</a></router-link>
        <div><a href="https://upchieve.org/" target="_blank">OUR WEBSITE</a></div>
      </div>
    </div>
  </div>
</template>

<script>

import CodeForm from './Registration/CodeForm';
import SignupForm from './Registration/SignupForm';

import RegistrationService from '../services/RegistrationService';

export default {
  components: {
    CodeForm,
    SignupForm
  },
  data(){
    return RegistrationService.data;
  }
}
</script>

<style scoped>
.registration-container {
  height: 100%;
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

.footer {
  display: flex;
  font-weight: 600;
  font-size: 12px;
  justify-content: space-around;
  width: 500px;
  height: 40px;
  align-items: center;
  align-self: center;
  padding: 0 50px;
  background-color: #F6F6F6;
  border-top: 0.5px solid #CCCCCF;
}

.footer a {
  color: #73737A;
}

</style>
