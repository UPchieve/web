<template>
  <div class="DashboardBanner">
    <h1>Hello, {{ name }}!</h1>
    <h2 v-if="subheader">{{ subheader }}</h2>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    subheader: String,
  },
  computed: {
    ...mapGetters({
      name: 'user/firstName',
    }),
  },
}
</script>

<style lang="scss" scoped>
.DashboardBanner {
  @include flex-container(column, center, flex-start);
  @include child-spacing(top, 24px);

  background: url('@/assets/dashboardHeader@2x.png');
  background-position: 25%;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 8px;

  color: white;
  width: 100%;
  padding: 24px 16px;
  width: 100%;
  height: 225px;

  @include breakpoint-above('medium') {
    @include flex-container(column, center, center);
    @include child-spacing(top, 16px);
    height: 200px;
  }
}

h1 {
  margin: 0;
  padding: 0;

  @include font-category('display-small');
  @include breakpoint-above('medium') {
    @include font-category('display-large');
  }
}

h2 {
  margin: 0;
  padding: 0;

  @include font-category('heading');
  @include breakpoint-above('medium') {
    @include font-category('display-small');
  }
}
</style>
