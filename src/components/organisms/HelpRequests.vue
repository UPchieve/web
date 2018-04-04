<template>
<div class="help-requests">
  <table>
    <thead>
      <tr class="help-requests__header">
        <th>Student</th>
        <th>Help topic</th>
        <th>Answer question</th>
      </tr>
    </thead>
    <tbody class="help-requests__content">
      <tr 
        v-for="(req, index) in requests"
        class="help-request"
      >
        <td>
          <span class="avatar"><img :src="req.student.avatar" alt="Avatar"></span>
          {{ req.student.name }}
        </td>
        <td>
          <topic-label :label="req.helpTopic"></topic-label>
          {{ req.helpSubtopic }}
        </td>
        <td>
          <router-link tag="a" to="/" v-if="type === 'question'">Answer question »</router-link>
          <router-link tag="a" to="/" v-if="type === 'session'">Help student »</router-link>
        </td>
      </tr>
    </tbody>
  </table>
</div>
</template>


<script>
import TopicLabel from '../atoms/TopicLabel';

/*
* @notes
* [1] Full documentation of this "type": {
*       type: < 'question' | 'session' >
*       requests: Array[Request]
*         Request: {
*           student: {
*             name: String,
*             avatar: String
*           },
*           helpTopic: < math | college >,
*           helpSubtopic: 
*             < Algebra | Geometry | Trigonometry | Precalculus | Calculus >
*             < Planning | Essays | Applications >
*         }
*     }
*/
export default {
  components: {
    TopicLabel
  },
  props: {
    helpRequests: Object // [1]
  },
  data() {
    return {
      type: this.helpRequests.type,
      requests: this.helpRequests.requests 
    }
  }
}
</script>


<style>

</style>
