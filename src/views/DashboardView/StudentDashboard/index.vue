<template>
  <div class="student-dashboard">
    <dashboard-banner />
    <div
      v-if="noticeMessage"
      class="dashboard-notice"
      :class="isLowCoachHour && 'dashboard-notice--warn'"
    >
      {{ noticeMessage }}
    </div>
    <subject-selection />
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import DashboardBanner from "../DashboardBanner";
import SubjectSelection from "./SubjectSelection";
import moment from "moment-timezone";

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

    this.currentHour = moment()
      .tz("America/New_York")
      .hour();
  },
  data() {
    return {
      currentHour: 0
    };
  },
  computed: {
    ...mapState({
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit
    }),
    ...mapGetters({ isSessionAlive: "user/isSessionAlive" }),
    isLowCoachHour() {
      return this.currentHour < 12;
    },
    noticeMessage() {
      if (this.currentHour >= 12 && this.currentHour <= 23)
        return "Heads up: this is a great time to make a request! We have plenty of coaches available between 12pm - 12 am ET.";
      if (this.currentHour >= 3 && this.currentHour <= 9)
        return "Heads up: we have very few coaches available right now. Try making requests between 12pm-12am ET when possible";
      if (
        (this.currentHour >= 0 && this.currentHour < 3) ||
        (this.currentHour >= 9 && this.currentHour < 12)
      )
        return "Heads up: we have less coaches available than normal right now. Try making requests between 12pm-12am ET when possible!";

      return "";
    }
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

.dashboard-notice {
  padding: 15px;
  background-color: $c-success-green;
  border-radius: 8px;
  margin: 20px 0 -20px;
  font-weight: 500;
  font-size: 16px;
  color: #fff;

  &--warn {
    background-color: $c-warning-orange;
  }
}
</style>
