<template>
  <div class="classes">
    <div class="modal__content">
      {{ message }}
    </div>
    <div class="modal__options">
      <btn label="Exit session"></btn>
      <btn label="Submit question"></btn>
    </div>
  </div>  
</template>


<script>
  import Btn from '../atoms/Btn';
  
  export default {
    components: {
      Btn
    },
    props: {
      message: String,
      warn: Boolean
    },
    data() {
      return {
        classes: {
          'modal': true,
          'modal--warn': this.warn
        }
      }
    }
  }
</script>


<style>
  .modal {

  }
  .modal--warn {

  }
</style>