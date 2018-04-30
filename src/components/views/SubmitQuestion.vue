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
import UserService from '../../services/UserService';
import UserQuestionService from '../../services/UserQuestionService';

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
    showLoader() {
      document.querySelector('.form-loader').style = 'top: 0';
      document.querySelector('.form-loader__dot:nth-child(1)').style = 'animation: a-loader-1 2s ease-out infinite';
      document.querySelector('.form-loader__dot:nth-child(2)').style = 'animation: a-loader-1 1s 2s ease-out infinite';
    },
    submitQuestion(e) {

      e.preventDefault();

      this.showLoader();

      let questionObj = {};
          questionObj.topic = this.$route.query.topic;
          questionObj.subTopic = this.$route.query.subTopic;
          questionObj.studentName = UserService.getUser().name;
          questionObj.studentEmail = UserService.getUser().email;
          questionObj.content = document.getElementById('message').value;
          questionObj.attachment = document.getElementById('file').files;

      
      UserQuestionService.createUserQuestion(this, questionObj)
        .then(
          (res) => { console.log('component'); console.log(res) },
          (err) => {
            console.log('err');
          }
        );


      // this will be the success callback
      //this.showModal = true;
      //this.$el.style.overflow = 'hidden';
    },
    cancel() {
      this.$router.push('/');
    }
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