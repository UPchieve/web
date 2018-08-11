<template>
  <div class="registration-container background">
    <div class="form-register">
      <sig
      <code-form v-if="!validRegistrationCode"></code-form>
      <signup-form v-else></signup-form>
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

</style>
