<template>
  <div>
    <div :class="{ inactive: !partnerName }" class="session-header">
      <div class="main-session-header">
        <div class="avatar-info-container">
          <div :style="partnerAvatar" class="avatar" />
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
          <div class="end-session">
            <button class="btn btn-lg btn-block" @click.prevent="end">
              End session
            </button>
          </div>
        </div>
      </div>
      <div
        :class="[connectionMsgType]"
        class="connection-message-header"
        v-if="connectionMsg || reconnectAttemptMsg"
      >
        {{ connectionMsg }} {{ reconnectAttemptMsg }}
      </div>
    </div>
  </div>
</template>

<script>
import UserService from 'src/services/UserService'
import SessionService from 'src/services/SessionService'

import router from '../../router'

const STUDENT_AVATAR_URL = 'static/defaultavatar3.png'
const VOLUNTEER_AVATAR_URL = 'static/defaultavatar4.png'

/**
 * @todo {1} Refactoring candidate: use a modal instead.
 */
export default {
  data () {
    return {
      currentSession: SessionService.currentSession,
      connectionMsg: '',
      connectionMsgType: '',
      reconnectAttemptMsg: ''
    }
  },
  computed: {
    waitingText () {
      const user = UserService.getUser()
      if (user.isVolunteer) {
        return 'No student is in this session'
      }
      return 'We are contacting our Academic Coaches for you right now - please hang tight while we try to connect you! This process can take 5-10 minutes.'
    },
    partnerName () {
      const partner = SessionService.getPartner()
      return partner && partner.firstname
    },
    partnerAvatar () {
      const user = UserService.getUser()
      let picture = ''
      if (user.isVolunteer === false) {
        picture = VOLUNTEER_AVATAR_URL
      } else {
        picture = STUDENT_AVATAR_URL
      }
      return {
        backgroundImage: `url(${picture})`
      }
    }
  },
  methods: {
    end () {
      let studentId = ''
      let volunteerId = null
      let sessionId = SessionService.currentSession.sessionId
      if (
        SessionService.currentSession &&
        SessionService.currentSession.data.student
      ) {
        studentId = SessionService.currentSession.data.student._id
      }
      if (
        SessionService.currentSession &&
        SessionService.currentSession.data.volunteer
      ) {
        volunteerId = SessionService.currentSession.data.volunteer._id
      }

      const result = window.confirm('Do you really want to end the session?')
      if (result) {
        if (volunteerId) {
          this.$socket.disconnect()
          SessionService.endSession(this, sessionId, { skipRoute: true })
          const url =
            '/feedback/' +
            sessionId +
            '/' +
            (UserService.getUser().isVolunteer ? 'volunteer' : 'student') +
            '/' +
            studentId +
            '/' +
            volunteerId
          router.replace(url)
        } else {
          SessionService.endSession(this, sessionId, { skipRoute: true })
          router.replace('/')
        }
      }
    }
  },
  sockets: {
    connect_error (error) {
      console.log(`connection error: ${error}`)
      this.connectionMsg = 'The system seems to be having a problem reaching the server.'
      this.connectionMsgType = 'warning'
    },
    connect_timeout () {
      console.log('connection timeout')
      this.connectionMsg = 'The system seems to be having a problem reaching the server.'
      this.connectionMsgType = 'warning'
    },
    reconnect_attempt () {
      this.reconnectAttemptMsg = 'Trying to reconnect...'
    },
    reconnect () {
      this.connectionMsg = 'Connection successful. Please refresh the page, otherwise session messages may not appear.'
      this.reconnectAttemptMsg = ''
      this.connectionMsgType = 'success'
    }
    
  }
}
</script>

<style scoped>
.session-header {
  position: relative;
  height: 100px;
  background-color: #64e1c6;
  padding: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
}

.main-session-header {
  padding: 20px 20px 0 20px;
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
  color: #fff;
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
  background-color: #73737a;
}

.connection-message-header {
  padding: 3px;
  background-color: #858585;
  text-color: #fff;
  text-align: center;
  font-weight: 600;
  position: relative;
  bottom: 0;
}

.connection-message-header.warning {
  background-color: #ffde5e;
}

.connection-message-header.success {
  background-color: #fff;
}

.avatar-info-container {
  display: flex;
  align-items: center;
}


@media screen and (max-width: 488px) {
  .info {
    width: auto !important;
  }
}
</style>
