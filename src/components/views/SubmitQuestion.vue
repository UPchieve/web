<template>
<div class="submit-question">
  <basic-template headerTitle="Submit a question">
    <message-form 
      textareaLabel="What is your question?"
      :modalContainer="this"
      typeOfForm="submit-question"
    ></message-form>
  </basic-template>
  <modal v-if="showModal" :singleBtn="modalOptions.singleBtn" :warn="modalOptions.warn"
    :labels="modalBtnLabels"
    :message="modalOptions.message"
    :clickHandlers="modalClickHandlers"
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
      modalBtnLabels: [],
      modalOptions: {},
      modalClickHandlers: {}
    }
  },
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