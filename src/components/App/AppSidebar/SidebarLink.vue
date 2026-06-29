<template>
  <div>
    <a v-if="openNewTab" :href="to" target="_blank" :class="parentClass"
      ><slot></slot>
      <p>{{ text }}</p></a
    >
    <div v-else-if="onClick" :class="parentClass" @click="onClick">
      <slot></slot>
      <p>{{ text }}</p>
    </div>
    <template v-else>
      <router-link
        :class="[parentClass, { 'SidebarLink--active': isActive }]"
        :to="to"
        tag="div"
        @click="$store.dispatch('app/sidebar/collapse')"
        @keydown.enter="navigate()"
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
    // When true, render the link with a prominent (blue pill) style — for
    // hero CTAs that still belong in the nav.
    emphasized: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapState({ isCollapsed: (state) => state.app.sidebar.isCollapsed }),
    ...mapGetters({ mobileMode: 'app/mobileMode' }),
    size() {
      return this.mobileMode ? '1em' : '1.5em'
    },
    parentClass() {
      return {
        SidebarLink: true,
        'SidebarLink--desktop': !this.mobileMode,
        'SidebarLink--emphasized': this.emphasized,
      }
    },
    isActive() {
      return (
        this.$route.path === this.to || this.$route.path.startsWith(this.to)
      )
    },
  },
  methods: {
    navigate() {
      this.$store.dispatch('app/sidebar/collapse')

      // necessary because router-link doesn't provide a way to set modifiers, like
      // keydown.enter, in the event prop
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
    color: var(--text-color);
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

  &--emphasized {
    background-color: $c-information-blue;
    border-radius: 12px;
    padding: 0.5em 0.75em;

    p {
      color: $upchieve-white;
      font-weight: 500;
    }

    &:hover {
      background-color: darken($c-information-blue, 5%);
    }
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
