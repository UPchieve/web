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
  render() {
    return null
  },
}
</script>
