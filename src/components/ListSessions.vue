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

const SOCKET_ADDRESS = 'http://localhost:3001';

import moment from 'moment'
import UserService from '../services/UserService'

import {router} from '../main'

let App = {},
    openSessions = [];

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
  mounted(){
    App.socket = require('socket.io-client')(SOCKET_ADDRESS);
    App.socket.on('connect', function(){
      App.socket.emit('list', {
        user: UserService.getUser()
      });
    });
    App.socket.on('sessions', (sessions) => {
      this.openSessions = sessions;
      console.log(sessions);
    })
  }
}
</script>

<style scoped>
</style>
