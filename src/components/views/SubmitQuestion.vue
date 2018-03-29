<template>
  <div class="SubmitQuestion">
    <modal warn 
      :labels="btnLabels"
      :message="message"
      :clickHandlers="clickHandlers"
    ></modal>
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
        btnLabels: [
          'Exit session',
          'Submit question'
        ],
        message: `
          We don’t have any Academic Coaches
          available right now, but you can submit a
          written question, and we will try to get
          back to you within 24 hours! Would you
          like to submit a question now?
        `,
        clickHandlers: {
          main: this.goHome,
          second: this.goHome
        }
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
    position: relative; /*[1]*/
    height: 100vh; /*[1]*/
  }
</style>