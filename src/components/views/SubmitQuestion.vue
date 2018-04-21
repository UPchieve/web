<template>
<div class="submit-question">
  <basic-template headerTitle="Submit a question">
    <message-form 
      textareaLabel="What is your question?"
      :clickHandlersBtnOptions="clickHandlersBtnOptions"
    ></message-form>
  </basic-template>
  <modal v-if="showModal" singleBtn
    :labels="btnLabels"
    :message="message"
    :clickHandlers="clickHandlersModal"
  ></modal>
</div>
</template>


<script>
import BasicTemplate from '../organisms/BasicTemplate';
import MessageForm from '../organisms/MessageForm';
import Modal from '../molecules/Modal';

export default {
  components: {
    BasicTemplate,
    MessageForm,
    Modal
  },
  data() {
    return {
      showModal: false,
      clickHandlersBtnOptions: {
        main: this.submitQuestion,
        second: this.cancel
      },
      message: `
        Thanks for submitting your question! You 
        will receive a response to your email 
        address as soon as possible.
      `,
      btnLabels: ['Go to home page'],
      clickHandlersModal: {
        main: () => {
          this.$router.push('/');
        }
      }
    }
  },
  methods: {
    submitQuestion() {
      // this will be the success callback
      this.showModal = true;
      this.$el.style.overflow = 'hidden';
    },
    cancel() {
      this.$router.push('/');
    }
  },
  mounted() {
    
  }
}
</script>


<style>
/*
* @notes
* [1] Refactoring candidate: this should be in the global container
*/
.submit-question { /*[1]*/
  height: 100vh;
  position: relative;
}
</style>