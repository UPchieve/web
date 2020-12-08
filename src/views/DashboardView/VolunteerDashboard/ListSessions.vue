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
    <audio
      class="audio__new-waiting-student"
      src="@/assets/audio/alert.mp3"
      muted
    />
  </div>
</template>

<script>
import { mapState } from "vuex";
import { allSubtopics } from "@/utils/topics";
import sendWebNotification from "@/utils/send-web-notification";

export default {
  data() {
    return {
      openSessions: [],
      allSubtopics: {},
      emitListIntervalId: null,
      isInitialMount: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      isWebPageHidden: state => state.app.isWebPageHidden
    })
  },
  mounted() {
    this.allSubtopics = allSubtopics();
    this.isInitialMount = true;

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
    async sessions(sessions) {
      if (this.user.isBanned) {
        this.openSessions = [];
        return;
      }

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

      const prevOpenSessions = this.openSessions;
      this.openSessions = results;

      if (!this.isInitialMount) {
        // Look for the new session added
        let newSession;
        for (const session of this.openSessions) {
          const { _id: sessionId } = session;
          let isOldSession = false;
          for (const oldSession of prevOpenSessions) {
            if (oldSession._id === sessionId) isOldSession = true;
          }

          if (!isOldSession) newSession = session;
        }

        if (newSession) {
          try {
            const newWaitingStudentAudio = document.querySelector(
              ".audio__new-waiting-student"
            );
            // Unmuting the audio allows us to bypass the need for user interaction with the DOM before playing a sound
            newWaitingStudentAudio.muted = false;
            await newWaitingStudentAudio.play();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log("Unable to play audio");
          }

          sendWebNotification(
            `${
              newSession.student.firstname
            } needs help in ${this.subtopicDisplayName(newSession.subTopic)}`,
            {
              body: "Can you help them?"
            }
          );
        }
      }
      this.isInitialMount = false;
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

.audio__new-waiting-student {
  display: none;
}
</style>
