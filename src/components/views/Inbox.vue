<template>
<div class="inbox">
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
          for (let i=0; i<questions.length; i++) {

            let o = {};
              o.topic = questions[i].topic;
              o.subTopic = questions[i].subTopic;
              o.student = {};
              o.student.name = questions[i].student.name;
              o.student.picture = questions[i].student.picture;
              o._id = questions[i]._id;

            this.helpRequests.requests.push(o);
          }
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