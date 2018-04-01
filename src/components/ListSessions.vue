<template>
  <div class="session-list">
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Student</th>
          <th>Session type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="session in openSessions" v-on:click="gotoSession(session)" class="session-row">
          <td>{{session.student.firstname}}</td>
          <td>{{session.type}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

import moment from 'moment'
import UserService from '../services/UserService'

import {router} from '../router'

let openSessions = [];

export default {
  data(){
    let user = UserService.getUser();
    return {
      user: user,
      openSessions: openSessions
    }
  },
  methods: {
    gotoSession(session){
      console.log(session._id);
      router.push(`/session/${session.type}/{$session.subTopic }/${session._id}`);
    }
  },
  sockets: {
    sessions(sessions){
      let results = [];
      let socketSessions = sessions.filter(function(session){
        console.log(session);
        return !session.volunteer;
      });

      for (var i=0; i<socketSessions.length; i++) {
        let currentSession = socketSessions[i];
        if (socketSessions[i].type == 'college') {
          result.push(currentSession);
          continue;
        }

        let subTopic = currentSession.subTopic;

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
    }
  },
  mounted(){
    this.$socket.emit('list', {
      user: UserService.getUser()
    });
  }
}
</script>

<style scoped>

.session-row {
  cursor: pointer;
}

.session-row td {
  text-align: left;
}
</style>
