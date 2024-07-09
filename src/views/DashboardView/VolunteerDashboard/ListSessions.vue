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
          @click="gotoSession(session)"
        >
          <td>
            {{ session.student.firstname }}
            <span
              v-if="session.student.isShadowBanned && user.isAdmin"
              class="shadow-ban"
              >Shadow Banned</span
            >
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

export default {
  name: 'ListSessions',
  data() {
    return {
      emitListIntervalId: null,
      hasError: false,
      unsubscribeFromTick: () => undefined,
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isWebPageHidden: (state) => state.app.isWebPageHidden,
      sortedOpenSessions(state) {
        return state.volunteer.openSessions.slice().sort((first, second) => {
          if (first.createdAt < second.createdAt) return -1
          if (first.createdAt > second.createdAt) return 1
          return 0
        })
      },
      newWaitingStudentAudioElement: (state) =>
        state.volunteer.newWaitingStudentAudioElement,
      ticks: (state) => state.volunteer.ticks,
      openSessions: (state) => state.volunteer.openSessions,
    }),
    ...mapGetters({
      isMutedSubjectAlertsActive: 'featureFlags/isMutedSubjectAlertsActive',
    }),
  },
  watch: {
    ticks() {
      this.$forceUpdate()
    },
  },
  methods: {
    gotoSession(session) {
      const { type, subTopic, _id } = session
      const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${_id}`

      if (type && subTopic && _id) {
        this.$router.push(path)
      } else {
        this.$store.dispatch('user/clearSession')
      }
    },
    waitTime({ createdAt }) {
      const newTime = new Date().getTime() - new Date(createdAt).getTime()
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
.shadow-ban {
  margin-right: 8px;
  font-size: 12px;
  border-radius: 5px;
  background: $c-warning-orange;
  color: #fff;
  padding: 5px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
