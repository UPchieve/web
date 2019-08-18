<template>
  <upchieve-icon
    class="AppHeaderHamburger"
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
      return this.$store.state.app.isSidebarCollapsed ? "hamburger" : "cross";
    }
  },
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
}
</style>
