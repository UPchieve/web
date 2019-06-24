<template>
  <div class="FormPageTemplate">
    <img class="logo" src="~src/assets/p_logo_white.png" />
    <slot></slot>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.FormPageTemplate {
  @include flex-container(column, center, center);

  background: url('~src/assets/onboarding_background.png') no-repeat center fixed;
  background-size: cover;

  min-width: 300px;
  min-height: 100vh;

  padding: 20px;
}

.logo {
  max-width: 155px;
  margin-bottom: 20px;
}
</style>
