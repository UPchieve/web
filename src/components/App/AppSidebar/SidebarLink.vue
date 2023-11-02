<template>
  <div>
    <a v-if="openNewTab" :href="to" target="_blank" :class="parentClass"
      ><slot></slot>{{ text }}</a
    >
    <div v-else-if="onClick" :class="parentClass" @click="onClick()">
      <slot></slot>
      <p>{{ text }}</p>
    </div>
    <template v-else>
      <router-link
        :class="parentClass"
        active-class="SidebarLink--active"
        :to="to"
        tag="div"
        @click.native="$store.dispatch('app/sidebar/collapse')"
        @keydown.enter.native="navigate()"
        :tabindex="isCollapsed && mobileMode ? -1 : 0"
      >
        <slot></slot>
        <p>{{ text }}</p>
      </router-link>
    </template>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  props: {
    to: {
      type: String,
      required: false,
    },
    icon: Object,
    text: {
      type: String,
      required: true,
    },
    openNewTab: {
      type: Boolean,
      default: false,
    },
    onClick: {
      type: Function,
      required: false,
    },
  },
  computed: {
    ...mapState({ isCollapsed: state => state.app.sidebar.isCollapsed }),
    ...mapGetters({ mobileMode: 'app/mobileMode' }),
    size() {
      return this.mobileMode ? '1em' : '1.5em'
    },
    parentClass() {
      return {
        SidebarLink: true,
        'SidebarLink--desktop': !this.mobileMode,
      }
    },
  },
  methods: {
    navigate() {
      this.$store.dispatch('app/sidebar/collapse')

      // necessary because router-link doesn't provide a way to set modifiers, like
      // keydown.enter.native, in the event prop
      this.$router.push(this.to)
    },
  },
}
</script>

<style lang="scss" scoped>
.SidebarLink {
  @include flex-container(row, initial, center);
  @include font-category('display-small');

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
    @include font-category('button');
  }
}

a {
  @include font-category('subheading');
  color: $c-soft-black;
  display: block;

  &:hover {
    text-decoration: none;
  }
}
</style>
