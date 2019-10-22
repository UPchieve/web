<template>
  <div class="SessionFulfilledModal">
    <h1 class="SessionFulfilledModal-title">Session Fulfilled</h1>
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
      return (
        (this.modalData.isSessionEnded
          ? "This session has already ended."
          : "Another volunteer has already joined this session.") +
        " We apologize for the inconvenience. Thank you for volunteering with UPchieve!"
      );
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
