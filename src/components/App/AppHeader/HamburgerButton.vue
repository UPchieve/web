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
import { mapState, mapActions } from 'pinia'
import { useAppSidebarStore } from '@/stores/app/sidebar'
import HambugerIcon from '@/assets/hamburger.svg'
import CrossIcon from '@/assets/cross.svg'

export default {
  name: 'HamburgerButton',
  props: { tabindex: Number },
  computed: {
    ...mapState(useAppSidebarStore, ['isCollapsed']),
    icon() {
      return this.isCollapsed ? HambugerIcon : CrossIcon
    },
  },
  methods: {
    ...mapActions(useAppSidebarStore, ['expand', 'collapse']),
    handleAction() {
      if (this.isCollapsed) this.expand()
      else this.collapse()
    },
  },
}
</script>

<style lang="scss" scoped>
.icon {
  cursor: pointer;
  width: 20px;
  height: 20px;
}
</style>
