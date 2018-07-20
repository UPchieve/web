<template>
<div v-if="!user.isVolunteer" class="submit-question">
  <basic-template headerTitle="Submit a question">
    <message-form 
      textareaLabel="What is your question?"
      :modalContainer="this"
      typeOfForm="submit-question"
    ></message-form>
  </basic-template>
  <modal v-if="showModal" 
    singleBtn
    :warn="modalOptions.warn"
    :message="modalOptions.message"
    :labels="modalBtnLabels"
    :clickHandlers="modalClickHandlers"
  ></modal>
</div>
</template>


<script>
import UserService from '../../services/UserService';

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
      // This component
      user: UserService.getUser(),
      // Modal
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