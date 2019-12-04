<template>
  <div class="SessionFulfilledModal">
    <h1 class="SessionFulfilledModal-title">Session Fulfilled</h1>
    <div class="SessionFulfilledModal-message">{{ message }}</div>
    <large-button v-if="mobileMode" primary @click.native="onAccept">{{
      modalData.acceptText
    }}</large-button>
    <large-button v-if="mobileMode" secondary @click.native="onCancel">{{
      modalData.cancelText
    }}</large-button>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import LargeButton from "@/components/LargeButton";

export default {
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true }
  },
  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode"
    }),
    message() {
      return (
        (this.modalData.isSessionEnded
          ? "The student has already ended their session."
          : "Another volunteer has already joined this session.") +
        " Thanks for trying, we really appreciate it!"
      );
    }
  },
  methods: {
    onAccept() {
      this.$router.push({
        name: "FailedJoinFeedbackView",
        params: {
          sessionId: this.modalData.sessionId,
          topic: this.modalData.topic,
          subTopic: this.modalData.subTopic,
          volunteerId: this.modalData.volunteerId
        }
      });
    },
    onCancel() {
      this.$router.push("/");
    }
  }
};
</script>

<style lang="scss" scoped>
.SessionFulfilledModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }
}

.SessionFulfilledModal-title {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.SessionFulfilledModal-message {
  @include font-category("body");
}
</style>
