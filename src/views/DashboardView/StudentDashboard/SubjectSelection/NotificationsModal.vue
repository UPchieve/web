<template>
  <div class="NotificationsContainer">
    <div class="LoadingContainer" v-if="isLoadingSession">
      <loading-message message="Starting your session" />
    </div>
    <div class="NotificationsModal" v-else>
      <h1 class="NotificationsModal-title">Turn on notifications</h1>
      <h2 class="NotificationsModal-subtitle">
        An UPchieve volunteer is on the way! This could take up to 10 minutes.
        Do you want us to send you a notification once they’ve entered the chat?
      </h2>
      <div class="NotificationsModal-buttons">
        <large-button v-if="mobileMode" @click.native="onClose()"
          >Nah, I'll check every minute.</large-button
        >
        <large-button
          v-if="mobileMode"
          primary
          @click.native="handlePushNotification()"
          >Yes, please notify me!</large-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import { startSession } from "@/utils/session";
import LargeButton from "@/components/LargeButton";
import PortalService from "@/services/PortalService";
import NetworkService from "@/services/NetworkService";
import LoadingMessage from "@/components/LoadingMessage";
import * as Sentry from "@sentry/browser";

export default {
  components: { LargeButton, LoadingMessage },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      selectedSubtopic: "",
      isLoadingSession: false
    };
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp,
      hasPushToken: state => state.user.hasPushToken
    }),
    ...mapGetters({ mobileMode: "app/mobileMode" }),
    title() {
      return this.modalData.topic
        ? `Choose a ${this.modalData.topic} subject`
        : "Choose a subject";
    }
  },
  methods: {
    async handlePushNotification() {
      const { topic, selectedSubtopic } = this.modalData;

      try {
        this.isLoadingSession = true;
        const { token } = await PortalService.call("push.register");
        await NetworkService.savePushToken(this, { token: token });

        startSession(this.$router, topic, selectedSubtopic);
      } catch (error) {
        if (error.status !== 422) {
          Sentry.captureException(error);
        }

        startSession(this.$router, topic, selectedSubtopic);
      }
    },
    onClose() {
      this.$emit("cancel");
      this.$store.dispatch("app/modal/hide");
      const { topic, selectedSubtopic } = this.modalData;

      startSession(this.$router, topic, selectedSubtopic);
    }
  }
};
</script>

<style lang="scss" scoped>
h1,
h2,
p {
  margin: 0;
  padding: 0;
}

.icon {
  align-self: center;
}

.NotificationsContainer {
  display: flex;
  height: 100%;
}

.NotificationsModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  height: 100%;
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }
}

.NotificationsModal-title {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.NotificationsModal-subtitle {
  @include font-category("heading");
  color: $c-secondary-grey;
}

.NotificationsModal-subtopic {
  @include flex-container(row, space-between, center);
  @include child-spacing(left, 16px);
  @include font-category("button");

  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 20px 24px;

  @include breakpoint-below("tiny") {
    @include flex-container(column, center, center);
    @include child-spacing(left, 0);
    @include child-spacing(top, 16px);
  }

  @include breakpoint-above("medium") {
    color: $c-secondary-grey;
    cursor: pointer;
    border-radius: 4px;
    justify-content: center;
    padding: 10px;

    &--selected {
      border-color: $c-success-green;
      color: $c-success-green;
    }
  }
}

.NotificationsModal-buttons {
  @include flex-container(column);
  @include child-spacing(top, 16px);
  margin-top: auto;
  margin-bottom: 4em;

  & > button {
    margin-bottom: 0.5em;
    padding: 1em 0;
  }

  @include breakpoint-above("medium") {
    @include child-spacing(top, 0);

    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    grid-gap: 24px;

    margin: 40px 0;

    & > button {
      padding: initial;
    }
  }
}

.LoadingContainer {
  @include font-category("display-small");
  margin: 0 auto;
  align-self: center;
}
</style>
