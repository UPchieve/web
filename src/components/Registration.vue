<template>
  <div class="registration-container">
    <sig
    <code-form v-if="!validRegistrationCode"></code-form>
    <signup-form v-else></signup-form>
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
</style>
