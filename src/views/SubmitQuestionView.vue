<template>
  <div v-if="!user.isVolunteer" class="submit-question">
    <basic-template header-title="Submit a question">
      <message-form
        :modal-container="this"
        textarea-label="What is your question?"
        type-of-form="submit-question"
      />
    </basic-template>
    <modal
      v-if="showModal"
      :warn="modalOptions.warn"
      :message="modalOptions.message"
      :labels="modalBtnLabels"
      :click-handlers="modalClickHandlers"
      single-btn
    />
  </div>
</template>

<script>
import UserService from '../services/UserService'

import BasicTemplate from '../components/organisms/BasicTemplate'
import MessageForm from '../components/organisms/MessageForm'
import Modal from '../components/molecules/Modal'

export default {
  components: {
    BasicTemplate,
    MessageForm,
    Modal
  },
  data () {
    return {
      // This component
      user: UserService.getUser(),
      // Modal
      showModal: false,
      modalBtnLabels: [],
      modalOptions: {},
      modalClickHandlers: {}
    }
  }
}
</script>

<style lang="scss">
/*
* @notes
* [1] Refactoring candidate: this should be in the global container
*/
.submit-question {
  /*[1]*/
  height: 100vh;
  position: relative;
}
</style>
