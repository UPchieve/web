<template>
  <div class="session-list">
    <h2>Open sessions</h2>
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Student</th>
          <th>Session type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="session in openSessions" v-on:click="gotoSession(session)" class="session-row">
          <td>{{session.student.name}}</td>
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
    return {
      openSessions: openSessions
    }
  },
  methods: {
    gotoSession(session){
      console.log(session._id);
      router.push(`/session/${session.type}/${session._id}`);
    }
  },
  sockets: {
    sessions(sessions){
      this.openSessions = sessions.filter(function(session){
        console.log(session);
        return !session.volunteer;
      });
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
h2 {
  font-size: 24px;
  font-weight: 600;
  text-align: left;
}

.session-row {
  cursor: pointer;
}

.session-row td {
  text-align: left;
}
</style>
