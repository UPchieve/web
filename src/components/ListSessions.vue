<template>
  <table class="table table-striped">
    <thead>
      <tr>
        <th>Id</th>
        <th>Student</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="session in openSessions" v-on:click="gotoSession(session)">
        <td>{{session._id}}</td>
        <td>{{session.student.name}}</td>
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
      router.push(`/session/${session._id}`);
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
</style>
