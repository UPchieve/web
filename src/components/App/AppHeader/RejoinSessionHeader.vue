<template>
  <div class="RejoinSessionHeader">
    <template v-if="mobileMode">
      <hyperlink-button primary reverse @click.native="showModal">{{
        message
      }}</hyperlink-button>
    </template>

    <template v-else>
      <div class="RejoinSessionHeader-left" />
      <div class="RejoinSessionHeader-message">{{ message }}</div>
      <div class="RejoinSessionHeader-buttons">
        <hyperlink-button reverse @click.native="end"
          >End chat</hyperlink-button
        >
        <large-button primary reverse @click.native="rejoin"
          >Return to chat</large-button
        >
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import * as sessionUtils from "@/utils/session";
import HyperlinkButton from "@/components/HyperlinkButton";
import LargeButton from "@/components/LargeButton";

export default {
  name: "rejoin-session-header",
  components: { HyperlinkButton, LargeButton },
  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode",
      avatarUrl: "user/avatarUrl",
      name: "user/firstName",
      sessionPath: "user/sessionPath"
    }),
    message() {
      return `You have a chat in session${this.mobileMode ? "" : "."}`;
    }
  },
  methods: {
    showModal() {
      this.$store.dispatch("app/modal/show", {
        component: "RejoinSessionModal",
        data: { backText: "Dashboard", important: true }
      });
    },
    rejoin() {
      sessionUtils.rejoinSession(this.$router, this.sessionPath);
    },
    end() {
      sessionUtils.endSession(this);
    }
  }
};
</script>

<style lang="scss" scoped>
.RejoinSessionHeader {
  @include flex-container(row, center, center);
  flex: 1;

  @include breakpoint-above("medium") {
    justify-content: space-around;
  }
}

.RejoinSessionHeader-left {
  display: none;

  @include breakpoint-above("large") {
    display: block;
    flex: 1;
  }
}

.RejoinSessionHeader-message {
  @include font-category("display-small");
  color: white;
}

.RejoinSessionHeader-buttons {
  @include flex-container(row, flex-end, center);
  @include child-spacing(left, 20px);
  @include breakpoint-above("large") {
    flex: 1;
  }
}
</style>
