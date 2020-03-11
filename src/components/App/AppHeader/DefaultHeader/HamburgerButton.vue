<template>
  <component class="icon" :is="icon" v-on:click="handleClick" />
</template>

<script>
import HambugerIcon from "@/assets/hamburger.svg?inline";
import CrossIcon from "@/assets/cross.svg?inline";

export default {
  computed: {
    icon() {
      return this.$store.state.app.sidebar.isCollapsed
        ? HambugerIcon
        : CrossIcon;
    }
  },
  methods: {
    handleClick() {
      const action = this.$store.state.app.sidebar.isCollapsed
        ? "app/sidebar/expand"
        : "app/sidebar/collapse";
      this.$store.dispatch(action);
    }
  }
};
</script>

<style lang="scss" scoped>
.icon {
  cursor: pointer;
  width: 16px;
  height: 16px;
}
</style>
