<template>
  <div class="session-list">
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Student</th>
          <th>Help Topic</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="session in openSessions"
          class="session-row"
          @click="gotoSession(session)">
          <td>{{ session.student.firstname }}</td>
          <td>{{ session.subTopic.charAt(0).toUpperCase() + session.subTopic.substr(1) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

import moment from 'moment';
import UserService from '../services/UserService';

import { router } from '../router';

const openSessions = [];

export default {
  data() {
    const user = UserService.getUser();
    return {
      user,
      openSessions,
    };
  },
  mounted() {
    this.$socket.emit('list', {
      user: UserService.getUser(),
    });
  },
  methods: {
    gotoSession(session) {
      console.log(session._id);
      router.push(`/session/${session.type}/${session.subTopic}/${session._id}`);
    },
  },
  sockets: {
    sessions(sessions) {
      const results = [];
      const socketSessions = sessions.filter((session) => {
        console.log(session);
        return !session.volunteer;
      });

      for (let i = 0; i < socketSessions.length; i++) {
        const currentSession = socketSessions[i];
        if (socketSessions[i].type == 'college') {
          results.push(currentSession);
          continue;
        }

        const subTopic = currentSession.subTopic;

        if (subTopic == 'algebra') {
          if (this.user.algebra.passed) {
            results.push(currentSession);
          }
        }

        if (subTopic == 'geometry') {
          if (this.user.geometry.passed) {
            results.push(currentSession);
          }
        }

        if (subTopic == 'trigonometry') {
          if (this.user.trigonometry.passed) {
            results.push(currentSession);
          }
        }

        if (subTopic == 'esl') {
          if (this.user.esl.passed) {
            results.push(currentSession);
          }
        }

        if (subTopic == 'precalculus') {
          if (this.user.precalculus.passed) {
            results.push(currentSession);
          }
        }

        if (subTopic == 'calculus') {
          if (this.user.calculus.passed) {
            results.push(currentSession);
          }
        }
      }

      this.openSessions = results;
    },
  },
};
</script>

<style scoped>

.session-row {
  cursor: pointer;
}

.session-row td {
  text-align: left;
}
</style>
