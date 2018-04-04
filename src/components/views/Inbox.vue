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
              name: 'Student 1',
              avatar: 'url'
            },
            helpTopic: 'Math',
            helpSubtopic: 'Algebra'
          },
          {
            student: {
              name: 'Student 2',
              avatar: 'url'
            },
            helpTopic: 'College',
            helpSubtopic: 'Personal Statement'
          },
        ]
      }
    }
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