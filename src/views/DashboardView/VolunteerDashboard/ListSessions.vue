<template>
  <div class="session-list">
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Student</th>
          <th>Help Topic</th>
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
            {{
              session.subTopic.charAt(0).toUpperCase() +
                session.subTopic.substr(1)
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  data() {
    return {
      openSessions: []
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    })
  },
  mounted() {
    // reconnect socket if it isn't already
    if (!this.$socket.connected) {
      this.$socket.connect();
    }
    this.$socket.emit("list", {
      user: this.user
    });
  },
  methods: {
    gotoSession(session) {
      const { type, subTopic, _id } = session;
      const path = `/session/${type}/${subTopic}/${_id}`;

      if (type && subTopic && _id) {
        this.$router.push(path);
      } else {
        this.$store.dispatch("user/clearSession");
      }
    }
  },
  sockets: {
    sessions(sessions) {
      const results = [];
      const socketSessions = sessions.filter(session => !session.volunteer);

      for (let i = 0; i < socketSessions.length; i++) {
        const currentSession = socketSessions[i];
        if (socketSessions[i].type === "college") {
          results.push(currentSession);
        } else {
          const { subTopic } = currentSession;

          if (
            [
              "algebra",
              "geometry",
              "trigonometry",
              "esl",
              "precalculus",
              "calculus"
            ].some(s => s === subTopic && this.user.certifications[s].passed)
          ) {
            results.push(currentSession);
          }
        }
      }

      this.openSessions = results;
    }
  }
};
</script>

<style lang="scss" scoped>
.session-row {
  cursor: pointer;
}

.session-row td {
  text-align: left;
}

.session-list {
  padding: 20px;
}
</style>
