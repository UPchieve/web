<template>
  <div
    v-if="errors && errors.length"
    class="step-errors"
    role="alert"
    aria-labelledby="formErrors"
  >
    <h5 id="formErrors">Please correct the following problems:</h5>
    <ul>
      <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'FormErrors',
  props: {
    errors: [],
  },
}
</script>

<style lang="scss" scoped>
.step-errors {
  color: #bf0000;
  font-size: 14px;
  text-align: left;
}
</style>
