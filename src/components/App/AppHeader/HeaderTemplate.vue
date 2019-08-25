<template>
  <div
    class="HeaderTemplate"
    :class="{ 'HeaderTemplate--important': important }"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: "header-template",
  props: {
    important: Boolean
  }
};
</script>

<style lang="scss" scoped>
.HeaderTemplate {
  @include bind-app-header-height(height);
  @include flex-container(row, space-between, center);

  background: white;
  border-radius: 0px 0px 20px 20px;
  padding: 20px;
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z("header");

  &--important {
    background: $c-warning-orange;
  }

  @include breakpoint-above("medium") {
    border-radius: 0;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
    padding: 12px 20px;
  }
}
</style>
