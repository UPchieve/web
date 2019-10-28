<template>
  <div class="DashboardBanner">
    <h1 v-if="mobileMode" class="DashboardBanner-greeting">
      Hello, {{ name }}!
    </h1>

    <div class="DashboardBanner-banner">
      <h1 v-if="!mobileMode" class="DashboardBanner-greeting">
        Hello, {{ name }}!
      </h1>

      <slot></slot>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode",
      name: "user/firstName"
    })
  }
};
</script>

<style lang="scss" scoped>
.DashboardBanner {
  @include flex-container(column, initial, flex-start);
  @include child-spacing(top, 24px);
  width: 100%;

  h1 {
    margin: 0;
    padding: 0;
  }
}

.DashboardBanner-greeting {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    @include font-category("display-large");
    color: white;
  }
}

.DashboardBanner-banner {
  @include flex-container(column, flex-end, flex-start);
  background: url("~@/assets/dashboardHeader@2x.png");
  background-position: 25%;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 8px;

  padding: 24px 16px;
  width: 100%;
  height: 225px;

  @include breakpoint-above("medium") {
    @include flex-container(column, center, center);
    @include child-spacing(top, 16px);
    height: 400px;
  }
}
</style>
