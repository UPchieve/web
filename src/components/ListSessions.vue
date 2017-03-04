<template>
  <table class="table table-striped table-hover">
    <thead>
      <tr>
        <th>Student</th>
        <th>Session type</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="session in openSessions" v-on:click="gotoSession(session)" class="session-row">
        <td>{{session.student.name}}</td>
        <td>{{session.type}}</td>
        <td>{{session.createdAt}}</td>
      </tr>
    </tbody>
  </table>
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
      this.openSessions = sessions;
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
</style>
