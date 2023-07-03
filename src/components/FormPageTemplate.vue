<template>
  <div class="uc-column justify-between h-full">
    <div class="FormPageTemplate">
      <header>
        <img class="logo" src="~@/assets/p_logo_white.png" alt="UPchieve" />
      </header>
      <main>
        <slot></slot>
      </main>
    </div>
    <form-footer />
  </div>
</template>

<script>
import FormFooter from '@/components/FormFooter'
export default {
  components: {
    FormFooter,
  },
}
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

  height: 100%;
  min-width: 300px;
}

.logo {
  max-width: 155px;
  margin-bottom: 20px;
}
</style>
