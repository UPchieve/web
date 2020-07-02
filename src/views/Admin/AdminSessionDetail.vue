<template>
  <div v-if="session._id" class="session-detail">
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
    <div v-if="endedAt" class="session-detail__section">
      <div class="session-detail__section-title">Ended by {{ endedBy }}</div>
      <div>{{ endedAt }}</div>
    </div>
    <div class="session-detail__section">
      <div class="session-detail__section-title">
        Notifications
      </div>
      <router-link :to="`/admin/sessions/${session._id}/notifications`">{{
        session.notifications ? session.notifications.length : 0
      }}</router-link>
    </div>
    <div
      v-if="session.messages.length"
      class="session-detail__section session-detail__section--chat"
    >
      <div class="session-detail__section-title">
        Chat log ({{ session.messages.length }})
      </div>
      <chat-log
        :messages="session.messages"
        :student="session.student"
        :volunteer="session.volunteer"
      />
    </div>
    <div
      v-if="studentFeedback"
      class="session-detail__section session-detail__section--feedback"
    >
      <div class="session-detail__section-title">
        Student feedback
      </div>
      <feedback-preview :feedback="studentFeedback" />
    </div>
    <div
      v-if="volunteerFeedback"
      class="session-detail__section session-detail__section--feedback"
    >
      <div class="session-detail__section-title">
        Volunteer feedback
      </div>
      <feedback-preview :feedback="volunteerFeedback" />
    </div>
  </div>
</template>

<script>
import moment from "moment";
import { find } from "lodash";
import NetworkService from "@/services/NetworkService";
import UserPreview from "@/components/Admin/UserPreview";
import ChatLog from "@/components/Admin/ChatLog";
import FeedbackPreview from "@/components/Admin/FeedbackPreview";

export default {
  name: "AdminSessionDetail",

  components: { UserPreview, ChatLog, FeedbackPreview },

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
      if (!this.session.endedAt) return null;
      return moment(this.session.endedAt).format("l, h:mm:ss a");
    },
    endedBy() {
      if (this.session.endedBy === null) return "worker";
      return this.session.endedBy === this.session.student._id
        ? this.session.student.firstname
        : this.session.volunteer.firstname;
    },
    studentFeedback() {
      return find(this.session.feedbacks, { userType: "student" }, {});
    },
    volunteerFeedback() {
      return find(this.session.feedbacks, { userType: "volunteer" }, {});
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
  padding: 20px 15px;
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
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 10px 0;
    font-size: 20px;

    &--chat {
      margin: 20px 0 40px;
    }

    &--feedback {
      margin-bottom: 20px;
    }
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
