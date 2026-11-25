<template><span></span></template>
<script>
export default {
  name: 'document-title',
  props: ['title'],
  // The immediate title watcher runs before created, so the old title has to
  // be read earlier.
  beforeCreate() {
    this.previousTitle = document.title
  },
  beforeUnmount() {
    document.title = this.previousTitle
  },
  watch: {
    title: {
      immediate: true,
      handler() {
        document.title = this.title
      },
    },
  },
}
</script>
<style lang="scss" scoped>
span {
  width: 0;
  height: 0;
  display: none;
}
</style>
