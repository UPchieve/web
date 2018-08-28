<template>
  <div
    :class="{inactive: !partnerName}"
    class="session-header">
    <div class="avatar-info-container">
      <div
        :style="partnerAvatar"
        class="avatar"/>
      <div class="info">
        <template v-if="partnerName">
          <span class="volunteer-name">{{ partnerName }}</span>
        </template>
        <template v-else-if="currentSession.sessionId">
          {{ waitingText }}
        </template>
        <template v-else>
          Loading
        </template>
      </div>
    </div>
    <div class="button-container">
      <div
        v-if="partnerName"
        class="upload-file">
        <a
          class="btn btn-lg btn-block"
          target="_blank"
          href="#/upload">Upload file</a>
      </div>
      <div class="end-session">
        <button
          class="btn btn-lg btn-block"
          @click.prevent="end">End session</button>
      </div>
    </div>
  </div>
</template>


<script>
import UserService from 'src/services/UserService';
import SessionService from 'src/services/SessionService';

const DEFAULT_AVATAR_URL = 'static/defaultAvatar@2x.png';

export default {
  data() {
    return {
      currentSession: SessionService.currentSession,
    };
  },
  computed: {
    waitingText() {
      const user = UserService.getUser();
      if (user.isVolunteer) {
        return 'No student is in this session';
      }
      return 'We are contacting our Academic Coaches for you right now - please hang tight while we try to connect you! This process can take 5-10 minutes.';
    },
    partnerName() {
      const partner = SessionService.getPartner();
      return partner && partner.firstname;
    },
    partnerAvatar() {
      const partner = SessionService.getPartner();

      const partnerAvatar = partner && partner.picture || DEFAULT_AVATAR_URL;
      return {
        backgroundImage: `url(${partnerAvatar})`,
      };
    },
  },
  methods: {
    end() {
      const result = window.confirm('Do you really want to end the session?');
      if (result) {
        this.$socket.disconnect();
        SessionService.endSession();
      }
    },
  },
};
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
  justify-content: space-between;
  align-items: center;
}

h1 {
  margin: 0;
  text-align: left;
  font-size: 36px;
  line-height: 42px;
}

.avatar {
  width: 30px;
  height: 30px;
  background-image: url('../../assets/defaultAvatar@2x.png');
  background-size: cover;
}

.info {
  padding-left: 15px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  width: 600px;
}

.volunteer-name {
  font-weight: 700;
}

.btn {
  width: auto;
  height: 40px;
  color: #FFF;
  border: none;
  font-size: 16px;
  font-weight: 600;
  background-color: inherit;
}

.btn:hover {
  color: #000000;
}

.button-container {
  display: flex;
}

.session-header.inactive {
  background-color: #73737A;
}

.avatar-info-container {
  display: flex;
  align-items: center;
}

</style>
