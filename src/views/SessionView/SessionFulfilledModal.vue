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
  name: "SessionFulfilledModal",
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true }
  },
  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode",
      isVolunteer: "user/isVolunteer"
    }),
    message() {
      const {
        isSessionEnded,
        volunteerJoined,
        isSessionVolunteer,
        isSessionStudent
      } = this.modalData;
      const thankYouMessage = "Thanks for trying, we really appreciate it!";
      let text = "";

      if (isSessionEnded && !volunteerJoined) {
        if (isSessionStudent) {
          text = "You have canceled your request.";
        }
        if (this.isVolunteer) {
          text = `The student has canceled their request. ${thankYouMessage}`;
        }
      } else if (volunteerJoined && !isSessionVolunteer && this.isVolunteer) {
        text = `Another volunteer has already joined this session. ${thankYouMessage}`;
      } else {
        text = "This session has already finished.";
      }

      return text;
    },
    title() {
      const { isSessionEnded, volunteerJoined } = this.modalData;

      if (isSessionEnded && !volunteerJoined) {
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
