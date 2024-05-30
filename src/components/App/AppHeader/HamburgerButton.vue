<template>
  <span
    @click="handleAction"
    @keydown.enter="handleAction"
    :tabindex="tabindex"
  >
    <component class="icon" :is="icon" />
  </span>
</template>

<script>
import HambugerIcon from '@/assets/hamburger.svg'
import CrossIcon from '@/assets/cross.svg'

export default {
  name: 'HamburgerButton',
  props: { tabindex: Number },
  computed: {
    icon() {
      return this.$store.state.app.sidebar.isCollapsed
        ? HambugerIcon
        : CrossIcon
    },
  },
  methods: {
    handleAction() {
      const action = this.$store.state.app.sidebar.isCollapsed
        ? 'app/sidebar/expand'
        : 'app/sidebar/collapse'
      this.$store.dispatch(action)
    },
  },
}
</script>

<style lang="scss" scoped>
.icon {
  cursor: pointer;
  width: 16px;
  height: 16px;
}
</style>
