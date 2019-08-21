<template>
  <div class="StudentDashboard">
    <dashboard-header />
    <subject-selection />
  </div>
</template>

<script>
import DashboardHeader from '../DashboardBanner';
import SubjectSelection from './SubjectSelection';

export default {
  name: "student-dashboard",
  components: { DashboardHeader, SubjectSelection }
};
</script>

<style lang="scss" scoped>
.StudentDashboard {
  @include flex-container(column, center, center);
  @include child-spacing(top, 40px);
  padding: 40px 20px;

  @include breakpoint-above("medium") {
    padding: 40px;
  }
}
</style>
