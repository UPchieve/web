<template>
  <div class="HeaderTemplate">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'header-template',
}
</script>

<style lang="scss" scoped>
.HeaderTemplate {
  @include bind-app-header-height(height);
  @include flex-container(row, space-between, center);

  background-color: white;
  border-radius: 0px 0px 20px 20px;
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z('header');

  overflow: hidden;

  @include breakpoint-above('medium') {
    border-radius: 0;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
  }
}
</style>
