<template>
  <div v-if="session._id" class="session-detail">
    <router-link class="back-button" to="/admin/sessions"
      >← Back to sessions</router-link
    >

    <div class="session-detail__title">{{ session.subTopic }} session</div>
    <div class="session-detail__subtitle">ID: {{ session._id }}</div>

    <div v-if="session.student" class="session-detail__section">
      <div class="session-detail__section-title">Student</div>
      <user-preview :user="session.student" />
    </div>
    <div v-if="session.volunteer" class="session-detail__section">
      <div class="session-detail__section-title">Volunteer</div>
      <user-preview :user="session.volunteer" />
    </div>
    <div class="session-detail__section">
      <div class="session-detail__section-title">Started</div>
      <div>{{ createdAt }}</div>
    </div>
    <div v-if="session.volunteer" class="session-detail__section">
      <div class="session-detail__section-title">Volunteer joined</div>
      <div>{{ volunteerJoinedAt }}</div>
    </div>
    <div class="session-detail__section">
      <div class="session-detail__section-title">Ended</div>
      <div>{{ endedAt }}</div>
    </div>
    <div class="session-detail__section">
      <div class="session-detail__section-title">
        Notifications
      </div>
      <div>{{ session.notifications ? session.notifications.length : 0 }}</div>
    </div>
    <div v-if="session.messages.length" class="session-detail__section">
      <div class="session-detail__section-title">
        Chat log ({{ session.messages.length }})
      </div>
      <chat-log
        :messages="session.messages"
        :student="session.student"
        :volunteer="session.volunteer"
      />
    </div>
  </div>
</template>

<script>
import moment from "moment";
import NetworkService from "@/services/NetworkService";
import UserPreview from "@/components/Admin/UserPreview";
import ChatLog from "@/components/Admin/ChatLog";

export default {
  name: "AdminSessionDetail",

  components: { UserPreview, ChatLog },

  data() {
    return {
      session: {}
    };
  },

  computed: {
    createdAt() {
      return moment(this.session.createdAt).format("l, h:mm:ss a");
    },
    volunteerJoinedAt() {
      return moment(this.session.volunteerJoinedAt).format("l, h:mm:ss a");
    },
    endedAt() {
      return moment(this.session.endedAt).format("l, h:mm:ss a");
    }
  },

  async created() {
    const {
      body: { session }
    } = await NetworkService.adminGetSession(this.$route.params.sessionId);
    this.session = session;
  }
};
</script>

<style lang="scss" scoped>
.session-detail {
  max-width: 800px;
  background: #fff;
  margin: 10px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-radius: 8px;

  @include breakpoint-above("medium") {
    padding: 40px;
    margin: 40px;
  }

  &__title {
    text-transform: capitalize;
    font-size: 24px;
    margin-top: 20px;
  }

  &__subtitle {
    color: $c-secondary-grey;
    font-size: 18px;
    margin-bottom: 20px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 10px 0;
    font-size: 20px;
  }

  &__section-title {
    color: $c-secondary-grey;
    font-size: 16px;
  }
}

.back-button {
  display: inline-flex;
  color: #417db1;
  border-radius: 20px;
  padding: 5px 15px;
  cursor: pointer;

  &:hover {
    text-decoration: none;
    background: #f7fcfe;
  }
}
</style>
