<template>
<div class="submit-question">
  <basic-template headerTitle="Submit a question">
    <message-form 
      textareaLabel="What is your question?"
      :clickHandlersBtnOptions="clickHandlersBtnOptions"
    ></message-form>
  </basic-template>
  <modal v-if="showModal" :singleBtn="modalOptions.singleBtn" :warn="modalOptions.warn"
    :labels="btnLabels"
    :message="modalOptions.message"
    :clickHandlers="clickHandlersModal"
  ></modal>
</div>
</template>


<script>
import UserService from '../../services/UserService';
import StudentQuestionService from '../../services/StudentQuestionService';

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
      btnLabels: [],
      modalOptions: {},
      clickHandlersModal: {}
    }
  },
  methods: {
    showLoader() {
      document.querySelector('.form-loader').style = 'top: 0';
      document.querySelector('.form-loader__dot:nth-child(1)').style = 'animation: a-loader-1 2s ease-out infinite';
      document.querySelector('.form-loader__dot:nth-child(2)').style = 'animation: a-loader-1 1s 2s ease-out infinite';
    },
    hideLoader() {
      document.querySelector('.form-loader').style = '';
      document.querySelector('.form-loader__dot:nth-child(1)').style = '';
      document.querySelector('.form-loader__dot:nth-child(2)').style = '';
    },
    askForAMessage() {
      this.btnLabels = ['Write message'];
      this.modalOptions = {
        singleBtn: true,
        warn: true,
        message: `
          Message is empty!
        `
      };
      this.clickHandlersModal = {
        main: () => {
          this.showModal = false;
        }
      };
      this.showModal = true;
    },
    showResponseState(res) {
      if (res === 'notSent') {
        this.btnLabels = ['Retry'];
        this.modalOptions = {
          singleBtn: true,
          warn: true,
          message: `
            There was a problem sending the message
          `
        };
        this.clickHandlersModal = {
          main: () => {
            this.hideLoader();
            this.showModal = false;
          }
        };
      }
      else {
        this.btnLabels = ['Go to home page'];
        this.modalOptions = {
          singleBtn: true,
          warn: false,
          message: `
            Thanks for submitting your question! You 
            will receive a response to your email 
            address as soon as possible.
          `
        };
        this.clickHandlersModal = {
          main: () => {
            this.$router.push('/');
          }
        }
      }
      this.showModal = true;
    },
    submitQuestion(e) {

      e.preventDefault();

      if (document.getElementById('message').value !== '') {

        this.showLoader();

        let user = UserService.getUser();
        let questionObj = {};
            questionObj.topic = 
              this.$route.query.topic.charAt(0).toUpperCase() + 
              this.$route.query.topic.slice(1);
            questionObj.subTopic = 
              this.$route.query.subTopic.charAt(0).toUpperCase() + 
              this.$route.query.subTopic.slice(1);
            questionObj.student = {};
            questionObj.student.name = user.name;
            questionObj.student.email = user.email;
            questionObj.student.picture = user.picture;
            questionObj.content = document.getElementById('message').value;
            questionObj.attachments = document.getElementById('file').files;
        
        StudentQuestionService.createStudentQuestion(this, questionObj).then(
          (res) => { 
            this.showResponseState(res)
          }
        );
      }
      else {
        this.askForAMessage();
      }
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