<template>
<div class="SubmitQuestion">
  <modal :message="message"></modal>  
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
        message: `
          We don't have any Academic Coaches right now, but you can submit a 
          question. Would you like to submit a question?
        `
      }
    }
  }
</script>


<style>
    
</style>