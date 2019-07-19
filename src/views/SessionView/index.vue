<template>
  <div class="session">
    <div class="session-header-container">
      <session-header @try-clicked="tryClicked" />
    </div>
    <div v-if="currentSession.sessionId" class="session-contents-container">
      <div class="col-sm-8 whiteboard-container">
        <whiteboard />
      </div>
      <div class="col-sm-4 chat-container">
        <session-chat />
      </div>
    </div>

    <modal
      v-if="showModal"
      :labels="btnLabels"
      :message="message"
      :click-handlers="clickHandlers"
      warn
    />
  </div>
</template>

<script>
import SessionService from '@/services/SessionService'
import UserService from '@/services/UserService'

import SessionHeader from './SessionHeader'
import Whiteboard from './Whiteboard'
import SessionChat from './SessionChat'
import Modal from '@/components/Modal'

export default {
  name: "session-view",
  components: {
    SessionHeader,
    Whiteboard,
    SessionChat,
    Modal
  },
  /*
   * @notes
   * [1] Refactoring candidate: it'd be awesome if Dashboard could pass
   *     the topic directly
   */
  data () {
    return {
      currentSession: SessionService.currentSession,
      sessionReconnecting: false,
      showModal: false,
      btnLabels: ['Submit question', 'Exit session'],
      message: `
        We don’t have any Academic Coaches
        available right now, but you can submit a
        written question, and we will try to get
        back to you within 24 hours! Would you
        like to submit a question now?
      `,
      clickHandlers: {
        main: () => {
          this.$router.push({
            path: '/submit-question',
            query: {
              topic: this.$route.path.split('/')[2], // [1]
              subTopic: this.$route.params.subTopic
            }
          })
        },
        second: () => {
          this.$router.push('/')
        }
      }
    }
  },
  mounted () {
    const id = this.$route.params.sessionId
    let promise

    this.sessionId = id

    if (!id) {
      let type
      if (this.$route.path.indexOf('session/college') !== -1) {
        type = 'college'
      } else {
        type = 'math'
      }
      promise = SessionService.newSession(
        this,
        type,
        this.$route.params.subTopic
      )
    } else {
      promise = SessionService.useExistingSession(this, id)
    }

    promise.then(sessionId => {
      this.sessionId = this.currentSession.sessionId
      this.$socket.connect()
      this.joinSession(sessionId)
	})
    .catch(() => {
      window.alert('Could not start new help session')
      this.$router.replace('/')
    })

    // Offer the option to ask a question
    const MODAL_TIMEOUT_MS = 24 * 60 * 60 * 1000
    setTimeout(() => {
      if (
        !UserService.getUser().isVolunteer &&
        SessionService.getPartner() === undefined
      ) {
        this.showModal = true
      }
    }, MODAL_TIMEOUT_MS)
  },
  sockets: {
    bump () {
      this.$router.push('/')
    },
    reconnect_attempt () {
      this.sessionReconnecting = true
    },
    connect () {
      if (this.sessionReconnecting) {
        if (this.currentSession && this.currentSession.sessionId) {
          // we still need to re-join the room after Socket.IO re-establishes the connection
          this.joinSession(this.currentSession.sessionId)
        }
        else {
          location.reload()
        }
      }
    }
  },
  methods: {
    joinSession (sessionId) {
      this.$socket.emit('join', {
        sessionId,
        user: UserService.getUser()
      })
    },
    tryClicked () {
      this.sessionReconnecting = true
    }
  }
}
</script>

<style lang="scss" scoped>
/*
  * @notes
  * [1] Refactoring candidate: these styles should be placed in the container
  *     (we need to rethink the containing model in order to do so)
  */
.session {
  position: relative; /*[1]*/
  height: 100%; /*[1]*/
}

.session-header-container {
  position: absolute;
  left: 0;
  width: 100%;
}

.session-contents-container {
  height: 100%;
  padding-top: 100px;
}

.whiteboard-container {
  height: 100%;
  padding: 0;
  border-top: 25px solid #eaeaeb;
  border-left: 25px solid #eaeaeb;
  border-right: 25px solid #eaeaeb;
}

.chat-container {
  height: 100%;
  padding: 0;
}


@media screen and (max-width: 700px) {
  .whiteboard-container {
    width: 100% !important;
    height: 65vh !important;
  }

  .chat-container {
    width: 100% !important;
    height: 60vh !important;
  }
}
</style>
