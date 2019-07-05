<template>
  <div v-if="user.isVolunteer" class="inbox">
    <div class="tabular-template">
      <content-header header-title="Answer Questions" />
      <div class="tabular-template__content">
        <help-requests :help-requests="helpRequests" />
      </div>
    </div>
  </div>
</template>

<script>
import StudentQuestionService from 'src/services/StudentQuestionService'
import UserService from 'src/services/UserService'

import ContentHeader from 'src/components/atoms/ContentHeader'
import HelpRequests from './HelpRequests'

export default {
  name: "inbox-view",
  components: {
    ContentHeader,
    HelpRequests
  },
  data () {
    return {
      user: UserService.getUser(),
      helpRequests: {
        type: 'question',
        requests: []
      }
    }
  },
  mounted () {
    StudentQuestionService.getStudentQuestions(this, {}).then(questions => {
      questions.forEach(question => {
        this.helpRequests.requests.push(question)
      })
    })
  }
}
</script>

<style lang="scss">
/*
* @notes
* [1] Refactoring candidate: this should be in the global container
*/
.inbox {
  /*[1]*/
  height: 100vh;
  position: relative;
}
</style>
