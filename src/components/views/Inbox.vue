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
import Vue from 'vue';

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
        requests: [
          {
            topic: 'Maths',
            subTopic: 'Algebra',
            studentName: 'Mark',
            studentAvatar: '',
            _id: 'dfahkdjsfhkjdashfjkhsd',
          },
          {
            topic: 'Maths',
            subTopic: 'Algebra',
            studentName: 'Mary Ann',
            studentAvatar: '',
            _id: 'dfahkdjsfhkjdashfjkhsd',
          },
        ]
      }
    }
  },
  mounted() {
    StudentQuestionService.getStudentQuestions(this, {}).then(
        (questions) => {
          console.log(questions, 'ja');
          //Vue.set()

          /*
          CHALLENGE:
          HOW TO GET THE AVATAR

          OPTION 1: add studentId to the StudentQuestion schema and then retrieve avatar when I load the thing

          OPTION 2: add studentAvatar to the StudentQuestion schema and then just use the avatar

          ALSO CAPITALIZE topic and subTopic
          */
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