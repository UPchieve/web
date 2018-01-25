<template>
  <div class="session-header" v-bind:class="{inactive: !partnerName}">
    <div class="avatar" v-bind:style="partnerAvatar"></div>
    <div class="info">
      <template v-if="partnerName">
        In a session with: <br />
        <span class="volunteer-name">{{partnerName}}</span>
      </template>
      <template v-else-if="currentSession.sessionId">
        {{waitingText}}
      </template>
      <template v-else>
        Loading
      </template>
    </div>
    <div class="upload-file" v-if="partnerName">
      <a class="btn btn-lg btn-block" target="_blank" href="#/upload">Upload file</a>
    </div>
    <div class="end-session">
      <button class="btn btn-lg btn-block" @click.prevent="end">End session</button>
    </div>
  </div>
</template>

<script>

import UserService from 'src/services/UserService'
import SessionService from 'src/services/SessionService';

const DEFAULT_AVATAR_URL = 'static/defaultAvatar@2x.png';

export default {
  data(){
    return {
      currentSession: SessionService.currentSession
    }
  },
  computed: {
    waitingText(){
      var user = UserService.getUser()
      if (user.isVolunteer){
        return 'No student is in this session';
      } else {
          return 'We are contacting our Academic Coaches for you right now - please hang tight while we try to connect you! This process can take 5-10 minutes.';
      }
    },
    partnerName(){
      var partner = SessionService.getPartner();
      return partner && partner.firstname;
    },
    partnerAvatar(){
      var partner = SessionService.getPartner();

      var partnerAvatar = partner && partner.picture || DEFAULT_AVATAR_URL;
      return {
        backgroundImage: `url(${partnerAvatar})`
      }
    }
  },
  methods: {
    end(){
      var result = window.confirm('Do you really want to end the session?')
      if (result){
        this.$socket.disconnect();
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
  background-size: cover;
}

.info {
  padding-left: 15px;
  color: black;
  width: 500px;
  font-weight: 600;
}

.volunteer-name {
  font-weight: 700;
}

.btn {
  position: absolute;
  top: 30px;
  right: 30px;
  width: auto;
  height: 40px;
  color: #FFF;
  border: none;
  font-size: 16px;
  font-weight: 600;
  background-color: inherit;
}

.btn:hover {
  color: inherit;
}

.end-session .btn:hover {
  color: #F6F6F6;
}



.upload-file .btn {
  right: 230px;
}
</style>
