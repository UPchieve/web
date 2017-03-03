<template>
  <div class="session-header" v-bind:class="{inactive: !currentSession.active}">
    <div class="avatar"></div>
    <div class="info">
      <template v-if="currentSession.sessionPartner">
        In a session with: <br />
        <span class="volunteer-name">Volunteer Username</span>
      </template>
      <template v-else-if="currentSession.sessionId">
        Waiting for a volunteer...
      </template>
      <template v-else>
        Loading
      </template>
    </div>
    <div class="end-session">
      <button class="btn btn-lg btn-primary btn-block" @click.prevent="end">End session</button>
    </div>
  </div>
</template>

<script>

import SessionService from 'src/services/SessionService';


export default {
  data(){
    return {
      currentSession: SessionService.currentSession
    }
  },
  methods: {
    end(){
      var result = window.confirm('Do you really want to end the session?')
      if (result){
        SessionService.endSession();
      }
    }
  }
}
</script>

<style scoped>

.session-header {
  position: relative;
  height: 100px;
  background-color: #64E1C6;
  padding: 20px;
  text-align: left;
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
}

h1 {
  margin: 0;
  text-align: left;
  font-size: 36px;
  line-height: 42px;
}

.avatar {
  width: 60px;
  height: 60px;
  background-image: url('../../assets/defaultAvatar@2x.png');
  background-size: 60px 60px;
}

.info {
  padding-left: 15px;
  color: white;
}

.volunteer-name {
  font-weight: 700;
}

button {
  position: absolute;
  top: 30px;
  right: 30px;
  width: 190px;
  height: 40px;
  background-color: white;
  color: #64E1C6;
  border: none;
  font-size: 16px;
  font-weight: 700;
}

.session-header.inactive {
  background-color: #73737A;
}

.session-header.inactive button {
  color: #73737A;
}
</style>
