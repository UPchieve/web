<template>
  <div class="ConnectionTroubleModal">
    <h1 class="ConnectionTroubleModal-title">Connection Problems</h1>
    <div class="ConnectionTroubleModal-message">
      {{ modalData.message }}
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
.ConnectionTroubleModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }
}

.ConnectionTroubleModal-title {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.ConnectionTroubleModal-message {
  @include font-category("body");
}
</style>
