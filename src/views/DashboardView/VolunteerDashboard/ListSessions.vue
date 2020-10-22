<template>
  <div class="session-list">
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Student</th>
          <th>Help Topic</th>
          <th>Wait Time</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(session, index) in openSessions"
          :key="`session-${index}`"
          class="session-row"
          @click="gotoSession(session)"
        >
          <td>{{ session.student.firstname }}</td>
          <td>
            {{ subtopicDisplayName(session.subTopic) }}
          </td>
          <td>
            {{ waitTime(session.createdAt) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { allSubtopics } from "@/utils/topics";

export default {
  data() {
    return {
      openSessions: [],
      allSubtopics: {},
      emitListIntervalId: null
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    })
  },
  mounted() {
    this.allSubtopics = allSubtopics();

    // reconnect socket if it isn't already
    if (!this.$socket.connected) {
      this.$socket.connect();
      this.$socket.on("connect", this.emitList);
    } else {
      this.emitList();
    }
  },
  beforeDestroy() {
    clearInterval(this.emitListIntervalId);
  },
  methods: {
    emitList() {
      this.$socket.emit("list");
      this.startWaitTimeRefresh();
    },
    gotoSession(session) {
      const { type, subTopic, _id } = session;
      const path = `/session/${type}/${subTopic}/${_id}`;

      if (type && subTopic && _id) {
        this.$router.push(path);
      } else {
        this.$store.dispatch("user/clearSession");
      }
    },
    subtopicDisplayName(subtopic) {
      return this.allSubtopics[subtopic].displayName;
    },
    waitTime(time) {
      const newTime = new Date().getTime() - new Date(time).getTime();
      const seconds = Number((newTime / 1000).toFixed(0));
      const minutes = Number((newTime / (1000 * 60)).toFixed(0));
      const hours = Number((newTime / (1000 * 60 * 60)).toFixed(0));

      if (seconds < 60) {
        return "< 1 min";
      }
      if (minutes < 60) {
        if (minutes === 1) return `${minutes} min`;
        return `${minutes} mins`;
      }
      if (hours < 24) {
        if (hours === 1) return `${hours} hr`;
        return `${hours} hrs`;
      }
    },
    // Refresh the wait time on open sessions for waiting students
    // Force a re-render on this instance to show updated wait times if there are open sessions
    startWaitTimeRefresh() {
      this.emitListIntervalId = setInterval(() => {
        if (this.openSessions.length === 0) {
          clearInterval(this.emitListIntervalId);
          this.emitListIntervalId = null;
        } else this.$forceUpdate();
      }, 1000 * 60);
    }
  },
  sockets: {
    sessions(sessions) {
      // Start refreshing for open sessions if no timer is currently running
      if (sessions.length > 0 && !this.emitListIntervalId)
        this.startWaitTimeRefresh();

      const results = [];
      const socketSessions = sessions.filter(session => !session.volunteer);

      for (let i = 0; i < socketSessions.length; i++) {
        const session = socketSessions[i];
        const { subTopic } = session;

        const isAdminOrTestUser = this.user.isAdmin || this.user.isTestUser;
        // Show test accounts to admin and test volunteer accounts
        if (session.student.isTestUser && !isAdminOrTestUser) {
          continue;
        }

        if (
          Object.keys(allSubtopics()).some(
            s => s === subTopic && this.user.subjects.includes(s)
          )
        ) {
          results.push(session);
        }
      }

      this.openSessions = results;
    }
  }
};
</script>

<style lang="scss" scoped>
.session-list {
  padding: 10px 20px;
}

.session-row {
  cursor: pointer;
}

.session-row td {
  text-align: left;
}
</style>
