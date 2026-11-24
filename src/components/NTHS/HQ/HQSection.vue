<template>
  <section class="hq-section">
    <slot />
  </section>
</template>

<style scoped lang="scss">
.hq-section {
  @include nths-card(22px 24px);
  text-align: left;
}
</style>
