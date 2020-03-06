<template>
  <router-link
    :class="parentClass"
    active-class="SidebarLink--active"
    :to="to"
    tag="div"
    @click.native="$store.dispatch('app/sidebar/collapse')"
  >
    <slot></slot>
    <p>{{ text }}</p>
  </router-link>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  props: {
    to: {
      type: String,
      required: true
    },
    icon: Object,
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

.icon {
  padding-right: 16px;
  width: 16px;
  height: 16px;
}
</style>
