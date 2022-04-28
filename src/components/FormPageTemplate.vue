<template>
  <div class="FormPageTemplate">
    <header>
      <img class="logo" src="~@/assets/p_logo_white.png" alt="UPchieve" />
    </header>
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.FormPageTemplate {
  @include flex-container(column, center, center);

  main {
    @include flex-container(column, center, center);

    width: 100%;
  }

  background: url('~@/assets/onboarding_background.png') no-repeat center;
  background-size: cover;

  min-width: 300px;
  min-height: 100vh;

  padding: 20px;

  @include breakpoint-below('medium') {
    padding: 20px 10px;
  }

  // Cancel out the logo's height to maintain vertical centering of the main form.
  // With short enough viewports, this isn't helpful, so only above 700px.
  @media screen and (min-height: 700px) {
    & > *:last-child {
      margin-bottom: 85px;
    }
  }
}

.logo {
  max-width: 155px;
  margin-bottom: 20px;
}
</style>
