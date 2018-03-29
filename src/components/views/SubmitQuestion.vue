<template>
  <div class="SubmitQuestion">
    
  </div>
</template>


<script>
  import Modal from '../molecules/Modal';
  
  export default {
    components: {
      Modal
    },
    data() {
      return {
        
      }
    },
    methods: {
      goHome() {
        this.$router.push('/');
      }
    }
  }
</script>


<style>
  /*
  * @notes
  * [1] Refactoring candidate: these styles should be placed in the container
  *     (we need to rethink the containing model in order to do so)
  */
  .SubmitQuestion {
    
  }
</style>