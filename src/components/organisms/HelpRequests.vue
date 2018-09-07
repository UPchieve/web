<template>
  <div class="help-requests">
    <table class="help-requests-t">
      <thead>
        <tr class="help-requests-t__header">
          <th>Student</th>
          <th>Help topic</th>
          <th/>
        </tr>
      </thead>
      <tbody class="help-requests-t__content">
        <tr
          v-for="(request, index) in requests"
          :key="`request-${index}`"
          class="help-request"
        >
          <td>
            <span class="row-avatar"><img
              :src="req.student.picture"
              alt="Avatar"></span>
            {{ req.student.name }}
          </td>
          <td>
            <topic-label :label="req.topic"/>
            {{ req.subTopic }}
          </td>
          <td>
            <router-link
              v-if="type === 'question'"
              :to="`/send-answer?q=${req._id}`"
              tag="a">Answer question ›</router-link>
            <router-link
              v-if="type === 'session'"
              :to="`/send-answer?q=${req._id}`"
              tag="a">Help student ›</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script>
import TopicLabel from '../atoms/TopicLabel.vue';

/*
 * @note {1} Full documentation of involved "types":
 *            HelpRequestsObject: {
 *              type: < 'question' | 'session' >
 *              requests: Array[Request]
 *            }
 *            Request: {
 *              student: {
 *                name: String,
 *                avatar: String
 *              },
 *              helpTopic: < math | college >,
 *              helpSubtopic:
 *                < Algebra | Geometry | Trigonometry | Precalculus | Calculus >
 *                < Planning | Essays | Applications >
 *            }
 */
export default {
  components: {
    TopicLabel,
  },
  props: {
    helpRequests: {
      type: Object, // {1}
      required: true,
    },
  },
  data() {
    return {
      type: this.helpRequests.type,
      requests: this.helpRequests.requests,
    };
  },
};
</script>


<style>
.help-requests-t {
  width: 100%;
  margin-bottom: 64px;
}
.help-requests-t__header {
  height: 48px;
  border-bottom: 4px solid var(--c-shadow-header);
  width: 100%;
  line-height: 1;
}
.help-requests-t__header th:first-child {
  padding-left: 20px;
}
.help-requests-t__header th:last-child {
  padding-right: 20px;
}

.help-request {
  height: 48px;
  border-bottom: 2px solid var(--c-shadow-header);
  font-weight: 600;
}
.help-request td {
  text-align: left;
  line-height: 1;
  padding-right: 20px;
}
.help-request td:first-child,
.help-request td:last-child {
  position: relative;
}
.help-request td:first-child {
  padding-left: 48px;
}
.help-request td:last-child {
  padding-right: 20px;
}
.help-request td:first-child::after,
.help-request td:last-child::after {
  content: '';
  background: #fff;
  height: 2px;
  width: 20px;
  position: absolute;
  bottom: -2px;
}
.help-request td:first-child::after {
  left: 0;
}
.help-request td:last-child::after {
  right: 0;
}

.row-avatar {
  display: inline-block;
  width: 20px;
  height: 20px;
  overflow: hidden;
  border-radius: 100%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 20px;
}
.row-avatar img {
  width: 100%;
}
</style>
