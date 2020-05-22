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
            {{ subtopicDisplayName(session.subTopic) }}
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
      allSubtopics: {}
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
  methods: {
    emitList() {
      this.$socket.emit("list");
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
    }
  },
  sockets: {
    sessions(sessions) {
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
            s => s === subTopic && this.user.certifications[s].passed
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
