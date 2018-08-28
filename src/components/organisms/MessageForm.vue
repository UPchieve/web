<template>
  <div class="message-form">
    <form
      class="question-form"
      onsubmit="return false;">
      <div class="form-body">
        <label for="message">{{ textareaLabel }}</label>
        <textarea
          id="message"
          name="message"/>
        <label for="">Attach a file (Optional - 7MB Max)</label>
        <input
          id="file"
          type="file"
          name="file"
          @change="changeHandler">
        <btn
          :click-handler="attachFile"
          big
          label="Upload a file"/>
        <ul class="file-list">
          <li v-for="file in fileList">{{ file }}</li>
        </ul>
      </div>
      <btn-options
        :click-handlers="btnOptionsClickHandlers"
        main-btn-label="Submit"
        second-btn-label="Cancel"
      />
      <div class="form-loader">
        <div class="form-loader__dot"/>
        <div class="form-loader__dot"/>
        <div class="form-loader__msg">
          Sending...
        </div>
      </div>
    </form>
  </div>
</template>


<script>
import Vue from 'vue';

import UserService from '../../services/UserService';
import StudentQuestionService from '../../services/StudentQuestionService';

import BtnOptions from '../molecules/BtnOptions';
import Btn from '../atoms/Btn';
import Attachment from '../atoms/Attachment';

function isValid() {
  const valid = document.getElementById('message').value !== '';
  return valid;
}

function buildFormDataObjSubmitQuestion(context) {
  const user = UserService.getUser();

  const questionObj = new FormData();
  questionObj.append(
    'topic',
    context.$route.query.topic.charAt(0).toUpperCase()
        + context.$route.query.topic.slice(1),
  );
  questionObj.append(
    'subTopic',
    context.$route.query.subTopic.charAt(0).toUpperCase()
        + context.$route.query.subTopic.slice(1),
  );
  questionObj.append(
    'student',
    `{ name: ${user.name}, email: ${user.email}, picture: ${user.picture} }`,
  );
  questionObj.append('content', document.getElementById('message').value);
  questionObj.append('attachments', document.getElementById('file').files[0]);

  return questionObj;
}

function buildFormDataObjSendAnswer(context) {
  const answerObj = new FormData();
  answerObj.append('userEmail', context.user.email);
  answerObj.append('questionId', context.$route.query.q);
  answerObj.append('answerContent', document.getElementById('message').value);
  answerObj.append('attachments', document.getElementById('file').files[0]);
  return answerObj;
}

function showModalRetry(context) {
  context.modalContainer.modalBtnLabels = ['Retry'];
  context.modalContainer.modalOptions = {
    singleBtn: true,
    warn: true,
    message: 'There was a problem sending the message',
  };
  context.modalContainer.modalClickHandlers = {
    main: () => {
      context.hideLoader();
      context.modalContainer.showModal = false;
    },
  };
}

function showModalSuccess(context, message) {
  context.modalContainer.modalBtnLabels = ['Go to home page'];
  context.modalContainer.modalOptions = {
    singleBtn: true,
    warn: false,
    message,
  };
  context.modalContainer.modalClickHandlers = {
    main: () => {
      context.$router.push('/');
    },
  };
}

export default {
  components: {
    BtnOptions,
    Btn,
    Attachment,
  },
  props: {
    textareaLabel: String,
    modalContainer: Object,
    typeOfForm: String,
  },
  data() {
    return {
      fileList: [],
      btnOptionsClickHandlers: {
        main: this.submitForm,
        second: this.cancel,
      },
    };
  },
  methods: {

    // File attachment
    attachFile() {
      const click = new MouseEvent('click');
      this.$el.querySelector('input[type="file"]').dispatchEvent(click);
    },
    changeHandler(e) {
      e.preventDefault();
      Vue.set(this.fileList, 0, document.getElementById('file').files[0].name);
    },

    // Form feedback
    askForAMessage() {
      this.modalContainer.modalOptions = {
        warn: true,
        message: `
          Message is empty!
        `,
      };
      this.modalContainer.modalBtnLabels = ['Write message'];
      this.modalContainer.modalClickHandlers = {
        main: () => {
          this.modalContainer.showModal = false;
        },
      };
      this.modalContainer.showModal = true;
    },
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
    showResponseStateSubmitQuestion(res) {
      if (res === 'notSent') {
        showModalRetry(this);
      } else {
        const message = `
          Thanks for submitting your question! You will receive a response to 
          your email address as soon as possible.
        `;
        showModalSuccess(this, message);
      }
      this.modalContainer.showModal = true;
    },
    showResponseStateSendAnswer(res) {
      if (res === 'notSent') {
        showModalRetry(this);
      } else {
        const message = 'Your answer has been sent!';
        showModalSuccess(this, message);
      }
      this.modalContainer.showModal = true;
    },

    // Form options (buttons)
    cancel() {
      this.$router.push('/');
    },
    submitFormSubmitQuestion(formDataObj) {
      StudentQuestionService.createStudentQuestion(this, formDataObj).then(
        (res) => {
          this.showResponseStateSubmitQuestion(res);
        },
      );
    },
    submitFormSendAnswer(formDataObj) {
      StudentQuestionService.answerStudentQuestion(this, formDataObj).then(
        (res) => {
          this.showResponseStateSendAnswer(res);
        },
      );
    },
    submitForm(e) {
      e.preventDefault();

      if (isValid()) {
        this.showLoader();

        if (this.typeOfForm === 'submit-question') {
          this.submitFormSubmitQuestion(buildFormDataObjSubmitQuestion(this));
        } else if (this.typeOfForm === 'send-answer') {
          this.submitFormSendAnswer(buildFormDataObjSendAnswer(this.modalContainer));
        }
      } else {
        this.askForAMessage();
      }
    },
  },
};
</script>


<style>
.message-form {
  position: relative;
  overflow: hidden;
}

.form-body {
  margin-bottom: 80px;
  text-align: left;
}
.form-body label {
  width: 100%;
  font-weight: 500;
}
.form-body textarea {
  width: 100%;
  height: 200px;
  resize: none;
  border: 2px solid var(--c-accent);
  margin-bottom: 20px;
  padding: 4px 8px;
}
.form-body textarea:focus {
  outline: 0;
}
.form-body input[type="file"] {
  display: none;
}

.file-list {
  list-style: none;
  margin-top: 8px;
  padding: 0;
}

.form-loader {
  transition: all .25s ease-out;
  background: #fff;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  bottom: 0;
}
.form-loader__dot {
  width: 0;
  height: 0;
  background: var(--c-accent);
  border-radius: 100%;
  position: absolute;
  left: 50%;
  top: 44%;
  transform: translate(-50%,-50%);
}
.form-loader__msg {
  width: 100%;
  color: var(--c-accent);
  font-weight: bold;
  position: absolute;
  left: 12px;
  top: 52%;
  letter-spacing: .4em;
  text-transform: uppercase;
}

@keyframes a-loader-1 {
  0% {
    opacity: 1;
    width: 4px;
    height: 4px;
  }
  100% {
    opacity: 0;
    width: 64px;
    height: 64px;
  }
}
</style>
