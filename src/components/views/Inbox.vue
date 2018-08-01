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
    StudentQuestionService.getStudentQuestions(this, {})
      .then(
        (questions) => {
          questions.map((q) => {
            let o = {};
              o.topic = q.topic;
              o.subTopic = q.subTopic;
              o.student = {};
              o.student.name = q.student.name;
              o.student.picture = q.student.picture;
              o._id = q._id;

            this.helpRequests.requests.push(o);
          });
        }
      );
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