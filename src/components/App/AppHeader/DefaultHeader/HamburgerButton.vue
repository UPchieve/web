<template>
  <component
    class="icon"
    :is="icon"
    v-on:click="handleAction"
    v-on:keydown.enter="handleAction"
    :tabindex="tabindex"
  />
</template>

<script>
import HambugerIcon from '@/assets/hamburger.svg'
import CrossIcon from '@/assets/cross.svg'

export default {
  props: { tabindex: Number },
  computed: {
    icon() {
      return this.$store.state.app.sidebar.isCollapsed
        ? HambugerIcon
        : CrossIcon
    }
  },
  methods: {
    handleAction() {
      const action = this.$store.state.app.sidebar.isCollapsed
        ? 'app/sidebar/expand'
        : 'app/sidebar/collapse'
      this.$store.dispatch(action)
    }
  }
}
</script>

<style lang="scss" scoped>
.icon {
  cursor: pointer;
  width: 16px;
  height: 16px;
}
</style>
