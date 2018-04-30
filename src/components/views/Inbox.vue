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
            student: {
              name: 'John Doe',
              avatar: 'static/defaultavatar4.png'
            },
            helpTopic: 'Math',
            helpSubtopic: 'Algebra'
          },
          {
            student: {
              name: 'Sally Smith',
              avatar: 'static/defaultavatar4.png'
            },
            helpTopic: 'College',
            helpSubtopic: 'Personal Statement'
          },
        ]
      }
    }
  },
  mounted() {
    this.$http.post('http://localhost:3000/api/student-questions', {})
      .then(
        (questions) => {
          console.log('retrieved success');
          console.log(questions);
        }, 
        (err) => {
          console.log('retrieved error');
          console.log(err);
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