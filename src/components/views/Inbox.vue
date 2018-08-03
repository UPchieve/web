<template>
<div v-if="user.isVolunteer" class="inbox">
  <div class="tabular-template">
    <content-header headerTitle="Answer Questions"></content-header>
    <div class="tabular-template__content">
      <help-requests :helpRequests="helpRequests"></help-requests>
    </div>
  </div>
</div>
</template>


<script>
import StudentQuestionService from '../../services/StudentQuestionService';
import UserService from '../../services/UserService';

import ContentHeader from '../atoms/ContentHeader';
import HelpRequests from '../organisms/HelpRequests';

export default {
  components: {
    ContentHeader,
    HelpRequests
  },
  data() {
    return {
      user: UserService.getUser(),
      helpRequests: {
        type: 'question',
        requests: []
      }
    }
  },
  mounted() {
    StudentQuestionService.getStudentQuestions(this, {}).then((questions) => {
      questions.map((question) => {
        this.helpRequests.requests.push(question);
      });
    });
  }
}
</script>


<style>
/*
* @notes
* [1] Refactoring candidate: this should be in the global container
*/
.inbox { /*[1]*/
  height: 100vh;
  position: relative;
}
</style>