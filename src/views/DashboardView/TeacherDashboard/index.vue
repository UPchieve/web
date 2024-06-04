<template>
  <div class="teacher-dashboard">
    <dashboard-banner />
    <div class="main">
      <p>Nothing here yet!</p>
    </div>
  </div>
</template>

<script>
import DashboardBanner from '../DashboardBanner.vue'

export default {
  name: 'teacher-dashboard',
  components: {
    DashboardBanner,
  },
}
</script>

<style lang="scss" scoped>
.teacher-dashboard {
  padding: 40px 15px;
}

.main {
  @include flex-container(column, center, center);

  margin-top: 40px;
}
</style>
