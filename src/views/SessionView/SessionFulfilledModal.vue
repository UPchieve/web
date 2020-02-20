<template>
  <div class="SessionFulfilledModal">
    <h1 class="SessionFulfilledModal-title">{{ title }}</h1>
    <div class="SessionFulfilledModal-message">{{ message }}</div>
    <large-button v-if="mobileMode" primary @click.native="onAccept">{{
      modalData.acceptText
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
      const thankYouMessage = "Thanks for trying, we really appreciate it!";
      let text = "";

      if (this.modalData.isSessionEnded && !this.modalData.volunteerJoined) {
        text = "The session was canceled.";
      } else if (this.modalData.isSessionEnded) {
        text = "The student has already ended their session.";
      } else {
        text = "Another volunteer has already joined this session.";
      }

      return `${text} ${thankYouMessage}`;
    },
    title() {
      if (this.modalData.isSessionEnded && !this.modalData.volunteeredJoined) {
        return "Session Canceled";
      } else {
        return "Session Fulfilled";
      }
    }
  },
  methods: {
    onAccept() {
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
