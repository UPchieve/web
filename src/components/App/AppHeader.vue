<template>
  <div class="AppHeader">
  </div>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>
.AppHeader {
  @include bind-app-header-height(height);

  background: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z("header");
}
</style>
