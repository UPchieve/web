<template>
  <div class="student-dashboard">
    <dashboard-banner />
    <subject-selection />
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import DashboardBanner from "../DashboardBanner";
import SubjectSelection from "./SubjectSelection";

const headerData = {
  component: "RejoinSessionHeader",
  data: { important: true }
};

export default {
  name: "student-dashboard",
  components: { DashboardBanner, SubjectSelection },
  created() {
    if (this.isSessionAlive) {
      this.$store.dispatch("app/header/show", headerData);
    }

    if (this.isFirstDashboardVisit) {
      this.$store.dispatch("app/modal/show", {
        component: "StudentOnboardingModal",
        data: {
          showTemplateButtons: false
        }
      });
    }
  },
  computed: {
    ...mapState({
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit
    }),
    ...mapGetters({ isSessionAlive: "user/isSessionAlive" })
  },
  watch: {
    isSessionAlive(isAlive) {
      if (!isAlive) {
        this.$store.dispatch("app/header/show");
      } else {
        this.$store.dispatch("app/header/show", headerData);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.student-dashboard {
  @include flex-container(column);
  @include child-spacing(top, 40px);
  padding: 40px 20px;

  @include breakpoint-above("medium") {
    display: inline-flex;
    min-width: 100%;
    padding: 40px;
  }
}
</style>
