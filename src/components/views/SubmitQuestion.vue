<template>
<div class="SubmitQuestion">
  <div class="backdrop">
    <modal warn 
      :labels="btnLabels"
      :message="message"
      :clickHandlers="clickHandlers"
    ></modal>  
  </div>
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
  .backdrop {
    background: var(--c-backdrop-warn);
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>