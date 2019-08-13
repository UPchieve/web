<template>
  <div
    class="AppHeaderHamburger"
    :style="{background: $store.state.app.collapseSidebar ? 'limegreen' : 'red'}"
    v-on:click="handleClick"
  ></div>
</template>

<script>
export default {
  methods: {
    handleClick() {
      const action = this.$store.state.app.isSidebarCollapsed
        ? "app/expandSidebar"
        : "app/collapseSidebar";
      this.$store.dispatch(action);
    }
  }
};
</script>

<style lang="scss" scoped>
.AppHeaderHamburger {
  cursor: pointer;

  width: 16px;
  height: 12px;

  transition: all 250ms ease-in;
}
</style>
