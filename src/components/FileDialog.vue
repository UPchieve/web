<template>
  <input
    type="file"
    class="hidden-file-input"
    :accept="accept"
    :multiple="multiple"
    @change="handleFileSelect"
    :disabled="disabled"
  />
</template>

<script>
export default {
  props: {
    accept: {
      type: String,
      required: true,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    maxFileSizeBytes: {
      type: Number,
      required: false,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      dialogOpeningEvent: null,
      fileSelectionEvent: null,
    }
  },
  emits: ['file-selected', 'file-too-large'],
  methods: {
    openFileDialog(event) {
      this.dialogOpeningEvent = event
      document.querySelector('.hidden-file-input').click()
    },
    handleFileSelect(event) {
      this.fileSelectionEvent = event
      const files = event.target.files

      const filesArr = Array.from(event.target.files)
      if (this.maxFileSizeBytes) {
        const oversizedFiles = filesArr.filter(
          (file) => file.size > this.maxFileSizeBytes
        )

        if (oversizedFiles.length > 0) {
          this.$emit('file-too-large', oversizedFiles)
          return
        }
      }

      this.$emit('file-selected', {
        dialogOpeningEvent: this.dialogOpeningEvent,
        fileSelectionEvent: this.fileSelectionEvent,
        files: [...files],
      })
    },
  },
}
</script>

<style lang="scss">
.hidden-file-input {
  display: none !important;
}
</style>
