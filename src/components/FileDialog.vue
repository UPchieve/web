<template>
  <input
    type="file"
    class="hidden-file-input"
    :accept="accept"
    @change="handleFileSelect"
  />
</template>

<script>
export default {
  props: {
    accept: {
      type: String,
      required: true
    },
    fileSelected: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      dialogOpeningEvent: null,
      fileSelectionEvent: null
    }
  },
  methods: {
    openFileDialog(event) {
      this.dialogOpeningEvent = event
      document.querySelector('.hidden-file-input').click()
    },
    handleFileSelect(event) {
      this.fileSelectionEvent = event
      this.$emit('file-selected', {
        dialogOpeningEvent: this.dialogOpeningEvent,
        fileSelectionEvent: this.fileSelectionEvent
      })
    }
  }
}
</script>

<style lang="scss">
.hidden-file-input {
  display: none !important;
}
</style>
