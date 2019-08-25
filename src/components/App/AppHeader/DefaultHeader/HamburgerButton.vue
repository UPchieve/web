<template>
  <upchieve-icon
    class="HamburgerButton"
    :icon="icon"
    v-on:click.native="handleClick"
    size="16px"
  />
</template>

<script>
import UpchieveIcon from "@/components/UpchieveIcon";

export default {
  components: { UpchieveIcon },
  computed: {
    icon() {
      return this.$store.state.app.sidebar.isCollapsed ? "hamburger" : "cross";
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
.HamburgerButton {
  cursor: pointer;
}
</style>
