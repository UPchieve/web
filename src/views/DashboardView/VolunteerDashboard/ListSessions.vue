<template>
  <div class="session-list">
    <div v-if="hasError" class="session-list__error">
      <p>Failed to load a list of students. Please try refreshing</p>
    </div>
    <table v-else class="table table-striped table-hover">
      <thead>
        <tr>
          <th scope="col">Student</th>
          <th scope="col">Help Topic</th>
          <th scope="col">Wait Time</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(session, index) in sortedOpenSessions"
          :key="`session-${index}`"
          class="session-row"
          @click="gotoSession(session)"
        >
          <td>{{ session.student.firstname }}</td>
          <td>
            {{ session.subjectDisplayName }}
          </td>
          <td>
            {{ waitTime(session.createdAt) }}
          </td>
        </tr>
      </tbody>
    </table>
    <audio
      class="audio__new-waiting-student"
      src="@/assets/audio/alert.mp3"
      muted
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import sendWebNotification from '@/utils/send-web-notification'
import LoggerService from '@/services/LoggerService'
import Case from 'case'

export default {
  name: 'ListSessions',
  data() {
    return {
      openSessions: [],
      emitListIntervalId: null,
      isInitialMount: false,
      hasError: false,
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isWebPageHidden: (state) => state.app.isWebPageHidden,
      sortedOpenSessions() {
        // sorts the sessions by createdAt, with oldest sessions coming first
        return this.openSessions.slice().sort((first, second) => {
          if (first.createdAt < second.createdAt) {
            return -1
          } else if (first.createdAt > second.createdAt) {
            return 1
          } else {
            return 0
          }
        })
      },
    }),
    ...mapGetters({
      isMutedSubjectAlertsActive: 'featureFlags/isMutedSubjectAlertsActive',
      isRecapSocketUpdatesActive: 'featureFlags/isRecapSocketUpdatesActive',
    }),
  },
  mounted() {
    this.isInitialMount = true
    if (this.isRecapSocketUpdatesActive || this.$socket.connected)
      this.emitList()
    else if (!this.$socket.connected) {
      this.$socket.connect()
      this.$socket.on('connect', this.emitList)
    }
  },
  beforeDestroy() {
    clearInterval(this.emitListIntervalId)
  },
  methods: {
    emitList(retryCount = 0, maxRetries = 5) {
      let isAcknowledged = false
      let timeoutId

      this.$socket.emit('list', null, (response) => {
        if (response.status === 200) {
          isAcknowledged = true
          clearTimeout(timeoutId)
          this.handleIncomingSessions(response.sessions)
          this.startWaitTimeRefresh()
        }
      })

      if (retryCount < maxRetries) {
        // simple exponential backoff
        const delay = Math.pow(2, retryCount) * 500
        timeoutId = setTimeout(() => {
          if (!isAcknowledged) {
            this.emitList(retryCount + 1, maxRetries)
          }
        }, delay)
      } else {
        LoggerService.noticeError(
          `Max retry attempts reached, unable to fetch list of sessions for user: ${this.user.id}`
        )
        this.hasError = true
      }
    },
    gotoSession(session) {
      const { type, subTopic, _id } = session
      const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${_id}`

      if (type && subTopic && _id) {
        this.$router.push(path)
      } else {
        this.$store.dispatch('user/clearSession')
      }
    },
    waitTime(time) {
      const newTime = new Date().getTime() - new Date(time).getTime()
      const seconds = Number((newTime / 1000).toFixed(0))
      const minutes = Number((newTime / (1000 * 60)).toFixed(0))
      const hours = Number((newTime / (1000 * 60 * 60)).toFixed(0))

      if (seconds < 60) {
        return '< 1 min'
      }
      if (minutes < 60) {
        if (minutes === 1) return `${minutes} min`
        return `${minutes} mins`
      }
      if (hours < 24) {
        if (hours === 1) return `${hours} hr`
        return `${hours} hrs`
      }
    },
    // Refresh the wait time on open sessions for waiting students
    // Force a re-render on this instance to show updated wait times if there are open sessions
    startWaitTimeRefresh() {
      this.emitListIntervalId = setInterval(() => {
        if (this.openSessions.length === 0) {
          clearInterval(this.emitListIntervalId)
          this.emitListIntervalId = null
        } else this.$forceUpdate()
      }, 1000 * 60)
    },
    async handleIncomingSessions(sessions) {
      if (!sessions || !Array.isArray(sessions) || this.user.isBanned) {
        this.openSessions = []
        return
      }

      // Start refreshing for open sessions if no timer is currently running
      if (sessions.length > 0 && !this.emitListIntervalId)
        this.startWaitTimeRefresh()

      const results = []
      const socketSessions = sessions.filter((session) => !session.volunteer)

      for (let i = 0; i < socketSessions.length; i++) {
        const session = socketSessions[i]
        const { subTopic } = session

        const isAdminOrTestUser = this.user.isAdmin || this.user.isTestUser
        // Show test accounts to admin and test volunteer accounts
        if (session.student.isTestUser && !isAdminOrTestUser) {
          continue
        }
        if (
          this.user.subjects.includes(subTopic) &&
          !(
            this.isMutedSubjectAlertsActive &&
            this.user.mutedSubjectAlerts.includes(subTopic)
          )
        ) {
          results.push(session)
        }
      }

      const prevOpenSessions = this.openSessions
      this.openSessions = results

      if (!this.isInitialMount) {
        // Look for the new session added
        let newSession
        for (const session of this.openSessions) {
          const { _id: sessionId } = session
          let isOldSession = false
          for (const oldSession of prevOpenSessions) {
            if (oldSession._id === sessionId) isOldSession = true
          }

          if (!isOldSession) newSession = session
        }

        if (newSession) {
          try {
            const newWaitingStudentAudio = document.querySelector(
              '.audio__new-waiting-student'
            )
            // Unmuting the audio allows us to bypass the need for user interaction with the DOM before playing a sound
            newWaitingStudentAudio.muted = false
            await newWaitingStudentAudio.play()
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log('Unable to play audio')
          }

          sendWebNotification(
            `${newSession.student.firstname} needs help in ${newSession.subjectDisplayName}`,
            {
              body: 'Can you help them?',
            }
          )
        }
      }
      this.isInitialMount = false
    },
  },
  sockets: {
    async sessions(sessions) {
      this.handleIncomingSessions(sessions)
    },
  },
}
</script>

<style lang="scss" scoped>
thead {
  text-align: center;
}

.session-list {
  padding: 10px 20px;

  &__error {
    color: $c-error-red;
    text-align: center;
  }
}

.session-row {
  cursor: pointer;
}

.session-row td {
  text-align: left;
}

.audio__new-waiting-student {
  display: none;
}
</style>
