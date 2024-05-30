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
          :data-testid="`session-row-${session.student.firstname}`"
          class="session-row"
          :class="{
            'paid-tutors-pilot-test-group': shouldHighlightSession(
              session.paidTutorsPilotGroup
            ),
            flash: prioritySessions.has(session.id),
          }"
          @click="gotoSession(session)"
          @mouseover="
            (e) => {
              if (this.shouldHighlightSession(session.paidTutorsPilotGroup)) {
                openToast(e, toastText)
              }
            }
          "
          @mouseout="
            () => {
              if (this.shouldHighlightSession(session.paidTutorsPilotGroup)) {
                closeToast()
              }
            }
          "
        >
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
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Case from 'case'
import { toastController } from '@ionic/vue'

export default {
  name: 'ListSessions',
  data() {
    return {
      emitListIntervalId: null,
      hasError: false,
      unsubscribeFromTick: () => undefined,
      toast: null,
      toastText:
        'Please prioritize this request. We are prioritizing this session to improve student wait times as part of our experiment',
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isWebPageHidden: (state) => state.app.isWebPageHidden,
      sortedOpenSessions(state) {
        // sorts the sessions by whether or not the student is in the `test`
        // group of the paid tutors pilot (if that pilot is running)
        // then by createdAt, with oldest sessions coming first
        return state.volunteer.openSessions.slice().sort((first, second) => {
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
      newWaitingStudentAudioElement: (state) =>
        state.volunteer.newWaitingStudentAudioElement,
      ticks: (state) => state.volunteer.ticks,
      prioritySessions: (state) => state.volunteer.prioritySessions,
      openSessions: (state) => state.volunteer.openSessions,
    }),
    ...mapGetters({
      isMutedSubjectAlertsActive: 'featureFlags/isMutedSubjectAlertsActive',
      isPaidTutor: 'featureFlags/isPaidTutor',
      isPaidTutorsPilotRunning: 'featureFlags/isPaidTutorsPilotRunning',
    }),
  },
  mounted() {
    this.unsubscribeFromTick = this.$store.subscribeAction((action) => {
      if (action.type === 'volunteer/tick') {
        this.$forceUpdate()
      }
    })
  },
  beforeUnmount() {
    this.closeToast()
    this.unsubscribeFromTick()
  },
  methods: {
    async openToast(e, text) {
      if (text) {
        this.toast = await toastController.create({
          message: text,
          cssClass: 'priority-student-toast',
          positionAnchor: e.target.parentNode,
        })
        await this.toast.present()
      }
    },
    closeToast() {
      if (this.toast) {
        this.toast.dismiss()
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
    waitTime({ createdAt, paidTutorsPilotGroup }) {
      const newTime = new Date().getTime() - new Date(createdAt).getTime()
      const seconds = Number((newTime / 1000).toFixed(0))
      const minutes = Number((newTime / (1000 * 60)).toFixed(0))
      const hours = Number((newTime / (1000 * 60 * 60)).toFixed(0))
      const showSeconds = this.shouldHighlightSession(paidTutorsPilotGroup)

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
  },
}
</script>

<style lang="scss">
.priority-student-toast {
  --max-width: 200px;
}
</style>

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

.table-striped .paid-tutors-pilot-test-group {
  background-color: $c-background-blue;
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
