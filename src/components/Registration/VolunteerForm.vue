<template>
  <code-form v-if="!validRegistrationCode"></code-form>
  <signup-form v-else></signup-form>
</template>

<script>

import CodeForm from './CodeForm';
import SignupForm from './SignupForm';

import RegistrationService from '../../services/RegistrationService';

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
