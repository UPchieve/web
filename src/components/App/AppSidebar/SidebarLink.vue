<template>
  <router-link
    :class="parentClass"
    active-class="SidebarLink--active"
    :to="to"
    tag="div"
    v-on:click.native="$store.dispatch('app/collapseSidebar')"
  >
    <upchieve-icon v-if="icon" style="padding-right: 16px;" :icon="icon" :size="size" />
    <p>{{ text }}</p>
  </router-link>
</template>

<script>
import { mapGetters } from "vuex";
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
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" }),
    size() {
      return this.mobileMode ? "1em" : "1.5em";
    },
    parentClass() {
      return {
        SidebarLink: true,
        "SidebarLink--desktop": !this.mobileMode
      };
    }
  }
};
</script>

<style lang="scss" scoped>
.SidebarLink {
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

  &--desktop {
    @include font-category("button");
  }
}
</style>
