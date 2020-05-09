<template>
  <div class="TroubleStartingModal">
    <h1 class="TroubleStartingModal-title">Connection Problems</h1>
    <div class="TroubleStartingModal-message">
      The system seems to be having a problem starting your new session. Please
      check your Internet connection.
    </div>
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
      mobileMode: "app/mobileMode",
      isVolunteer: "user/isVolunteer"
    })
  },
  methods: {
    onAccept() {
      this.modalData.abortFunction();
      this.$router.push("/");
    }
  }
};
</script>

<style lang="scss" scoped>
.TroubleStartingModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }
}

.TroubleStartingModal-title {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.TroubleStartingModal-message {
  @include font-category("body");
}
</style>
