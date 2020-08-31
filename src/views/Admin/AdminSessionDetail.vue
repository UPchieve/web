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
      <div class="session-detail__section">
        <div class="session-detail__section-title">Started</div>
        <div>{{ createdAt }}</div>
        <div v-if="session.userAgent" class="session-detail__section--device">
          <div>{{ devicePlatform }} - {{ session.userAgent.device }}</div>
          <div>
            {{ session.userAgent.browser }}:
            {{ session.userAgent.browserVersion }}
          </div>
          <div>
            {{ session.userAgent.operatingSystem }}:
            {{ session.userAgent.operatingSystemVersion }}
          </div>
        </div>
      </div>
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
      <router-link :to="`/admin/sessions/${session._id}/notifications`"
        >{{
          session.notifications ? session.notifications.length : 0
        }}
        sent</router-link
      >
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
    <div v-if="session.photos.length > 0" class="session-detail__section">
      <div class="session-detail__section-title">Photos</div>
      <img
        v-for="(image, index) in session.photos"
        :key="index"
        :src="image"
        class="session-detail__section--image"
      />
    </div>
    <div
      v-if="session.quillDoc"
      class="session-detail__section session-detail__section--document"
    >
      <h2 class="session-detail__section-title">Document</h2>
      <div class="quill-container"></div>
    </div>
    <div
      v-if="session.whiteboardDoc"
      class="session-detail__section session-detail__section--whiteboard"
    >
      <h2 class="session-detail__section-title">Whiteboard</h2>
      <div id="zwibbler-container"></div>
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
import Quill from "quill";

export default {
  name: "AdminSessionDetail",

  components: { UserPreview, ChatLog, FeedbackPreview },

  data() {
    return {
      session: {},
      quillEditor: null,
      zwibblerCtx: null
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
      const endedBy =
        this.session.endedBy === this.session.student._id
          ? this.session.student
          : this.session.volunteer;
      return endedBy ? endedBy.firstname : "?";
    },
    studentFeedback() {
      return find(this.session.feedbacks, { userType: "student" }, {});
    },
    volunteerFeedback() {
      return find(this.session.feedbacks, { userType: "volunteer" }, {});
    },
    devicePlatform() {
      if (
        this.session.userAgent.browser === "Chrome WebView" ||
        this.session.userAgent.browser === "WebKit"
      )
        return "Mobile app";

      if (
        this.session.userAgent.device === "Apple" ||
        this.session.userAgent.operatingSystem === "Android"
      )
        return "Mobile web";

      return "Desktop";
    }
  },

  async created() {
    const {
      body: { session }
    } = await NetworkService.adminGetSession(this.$route.params.sessionId);
    this.session = session;

    // Set quill document after the DOM has been updated to show session div
    this.$nextTick(() => {
      if (this.session.quillDoc) {
        const container = document.querySelector(".quill-container");
        this.quillEditor = new Quill(container);
        this.quillEditor.enable(false);
        this.quillEditor.setContents(JSON.parse(this.session.quillDoc));
      }

      if (this.session.whiteboardDoc) {
        this.zwibblerCtx = window.Zwibbler.create("zwibbler-container", {
          showToolbar: false,
          showColourPanel: false
        });

        this.zwibblerCtx.load(this.session.whiteboardDoc);
      }
    });
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

    &--image {
      width: 60%;
    }

    &--device {
      text-align: left;
      font-size: 14px;
      padding: 5px 10px;
      margin: 5px 0;
      border-left: solid #ececec 5px;
    }

    &--document {
      height: 500px;
      overflow-y: auto;
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

#zwibbler-container {
  height: 500px;
  width: 500px;
}
</style>
