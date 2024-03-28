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
          v-for="session in sortedOpenSessions"
          :key="`session-${session.id}`"
          :id="session.id"
          class="session-row"
          :class="{
            'paid-tutors-pilot-test-group': shouldHighlightSession(
              session.paidTutorsPilotGroup
            ),
            flash: flashStudents.has(session.id),
          }"
          @click="gotoSession(session)"
        >
          <b-tooltip
            v-if="shouldHighlightSession(session.paidTutorsPilotGroup)"
            :target="session.id"
            placement="top"
            variant="dark"
            custom-class="tooltip"
            delay="300"
            >Please prioritize this request. We are prioritizing this session to
            improve student wait times as part of our experiment.
          </b-tooltip>
          <td>
            {{ session.student.firstname }}
          </td>
          <td>
            {{ session.subjectDisplayName }}
          </td>
          <td>
            {{ waitTime(session) }}
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
import { BTooltip } from 'bootstrap-vue'

export default {
  name: 'ListSessions',
  data() {
    return {
      openSessions: [],
      emitListIntervalId: null,
      isInitialMount: false,
      hasError: false,
      flashStudents: new Set(),
    }
  },
  components: { BTooltip },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isWebPageHidden: (state) => state.app.isWebPageHidden,
      sortedOpenSessions() {
        // sorts the sessions by whether or not the student is in the `test`
        // group of the paid tutors pilot (if that pilot is running)
        // then by createdAt, with oldest sessions coming first
        return this.openSessions.slice().sort((first, second) => {
          if (this.isPaidTutorsPilotRunning) {
            if (
              first.paidTutorsPilotGroup === 'test' &&
              second.paidTutorsPilotGroup !== 'test'
            )
              return -1
            if (
              first.paidTutorsPilotGroup !== 'test' &&
              second.paidTutorsPilotGroup == 'test'
            )
              return 1
          }

          if (first.createdAt < second.createdAt) return -1
          if (first.createdAt > second.createdAt) return 1
          return 0
        })
      },
    }),
    ...mapGetters({
      isMutedSubjectAlertsActive: 'featureFlags/isMutedSubjectAlertsActive',
      isRecapSocketUpdatesActive: 'featureFlags/isRecapSocketUpdatesActive',
      isPaidTutor: 'featureFlags/isPaidTutor',
      isPaidTutorsPilotRunning: 'featureFlags/isPaidTutorsPilotRunning',
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

    this.newWaitingStudentAudio = document.querySelector(
      '.audio__new-waiting-student'
    )
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
    shouldHighlightSession(paidTutorsPilotGroup) {
      return this.isPaidTutorsPilotRunning && paidTutorsPilotGroup === 'test'
    },
    waitTime({ createdAt, id, paidTutorsPilotGroup }) {
      const newTime = new Date().getTime() - new Date(createdAt).getTime()
      const seconds = Number((newTime / 1000).toFixed(0))
      const minutes = Number((newTime / (1000 * 60)).toFixed(0))
      const hours = Number((newTime / (1000 * 60 * 60)).toFixed(0))
      const showSeconds = this.shouldHighlightSession(paidTutorsPilotGroup)
      /*
       * We want extra alerting for our paid tutors.
       * When we get close to the 40 second mark, we
       * want to alert the paid tutors that they should
       * pick it up soon by playing audio queues and
       * flashing the student that is closing in on the
       * 60 second mark. once we're at the 60 second mark,
       * it's too late for the study, we want to prioritize
       * other students under 60 seconds
       */
      if (seconds > 35 && seconds <= 60 && this.isPaidTutor && showSeconds) {
        this.flashStudents.add(id)
      } else {
        this.flashStudents.delete(id)
      }

      if (this.flashStudents.has(id)) {
        this.newWaitingStudentAudio.play()
      }

      if (seconds < 120 && showSeconds) {
        return `${seconds} second${seconds === 1 ? '' : 's'}`
      } else if (seconds < 60) {
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
    startWaitTimeRefresh(wait = 1000 * 60) {
      this.emitListIntervalId = setInterval(() => {
        if (this.openSessions.length === 0) {
          clearInterval(this.emitListIntervalId)
          this.emitListIntervalId = null
        } else {
          this.$forceUpdate()
        }
      }, wait)
    },
    async handleIncomingSessions(sessions) {
      if (!sessions || !Array.isArray(sessions) || this.user.isBanned) {
        this.openSessions = []
        return
      }

      // Start refreshing for open sessions if no timer is currently running
      if (sessions.length > 0 && !this.emitListIntervalId)
        this.startWaitTimeRefresh(
          this.isPaidTutorsPilotRunning ? 1000 : 1000 * 60
        )

      const results = []
      const socketSessions = sessions.filter((session) => !session.volunteer)

      for (let i = 0; i < socketSessions.length; i++) {
        const session = socketSessions[i]
        const { subTopic, type, paidTutorsPilotGroup } = session

        const isAdminOrTestUser = this.user.isAdmin || this.user.isTestUser
        // Show test accounts to admin and test volunteer accounts
        if (session.student.isTestUser && !isAdminOrTestUser) {
          continue
        }

        if (this.isPaidTutor && this.isPaidTutorsPilotRunning) {
          if (
            ['math', 'college'].includes(type) &&
            paidTutorsPilotGroup === 'test' &&
            this.user.subjects.includes(subTopic)
          ) {
            results.push(session)
          }
          // Paid tutor should only pick up students in the 'test' group
          // Do not show any other sessions
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
            // Unmuting the audio allows us to bypass the need for user interaction with the DOM before playing a sound
            this.newWaitingStudentAudio.muted = false
            await this.newWaitingStudentAudio.play()
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log('Unable to play audio', error)
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
.table-striped .paid-tutors-pilot-test-group {
  background-color: $c-background-blue;
}

.tooltip {
  opacity: 1;
}

.flash {
  animation: flash 1s ease-in-out infinite;
}

@keyframes flash {
  50% {
    background-color: $c-success-green;
  }
}
</style>
