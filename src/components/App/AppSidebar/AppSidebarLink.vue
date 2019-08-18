<template>
  <router-link
    class="AppSidebarLink"
    active-class="AppSidebarLink--active"
    :to="to"
    tag="div"
    v-on:click.native="$store.dispatch('app/collapseSidebar')"
  >
    <upchieve-icon v-if="icon" :icon="icon" style="padding-right: 16px;" />
    <p>{{ text }}</p>
  </router-link>
</template>

<script>
import UpchieveIcon from "@/components/UpchieveIcon";

export default {
  components: { UpchieveIcon },
  props: {
    to: {
      type: String,
      required: true
    },
    icon: String,
    text: {
      type: String,
      required: true
    }
  }
};
</script>

<style lang="scss" scoped>
.AppSidebarLink {
  @include flex-container(row, initial, center);
  @include font-category("display-small");

  cursor: pointer;

  p {
    margin: 0;
    padding: 0;
  }

  &--active {
    p {
      color: $c-success-green;
    }
  }
}
</style>
