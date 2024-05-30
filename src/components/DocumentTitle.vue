<template><span></span></template>
<script>
export default {
  name: 'document-title',
  props: ['title'],
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
