<template>
<div class="submit-question">
  <basic-template headerTitle="Submit a question">
    <form class="question-form">
      <div class="form-body">
        <label for="">What is your question?</label>      
        <textarea name="" id=""></textarea>
        <label for="">(Optional) Attach a file</label>
        <input type="file">
        <btn big label="Upload a file" :clickHandler="attachFile"></btn>
      </div>
      <btn-options 
        mainBtnLabel="Submit" 
        secondBtnLabel="Cancel" 
        :clickHandlers="clickHandlersBtnOptions"
      ></btn-options>
    </form>
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
import BtnOptions from '../molecules/BtnOptions';
import Modal from '../molecules/Modal';
import Btn from '../atoms/Btn';

export default {
  components: {
    BasicTemplate,
    BtnOptions,
    Modal,
    Btn
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
    attachFile() {
      const click = new MouseEvent('click');
      this.$el.querySelector('input[type="file"]').dispatchEvent(click);
    },
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
.submit-question {
  height: 100vh;
  position: relative;
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
</style>