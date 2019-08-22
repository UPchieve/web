<template>
  <div class="StudentDashboard">
    <dashboard-banner />
    <subject-selection />
  </div>
</template>

<script>
import DashboardBanner from "../DashboardBanner";
import SubjectSelection from "./SubjectSelection";

export default {
  name: "student-dashboard",
  components: { DashboardBanner, SubjectSelection }
};
</script>

<style lang="scss" scoped>
.StudentDashboard {
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
