<template>
  <i
    class="UpchieveIcon"
    :class="`ucif-${icon}`"
    :style="{ color, fontSize: size }"
  />
</template>

<script>
const icons = {
  // Regular
  arrow: true,
  book: true,
  calendar: true,
  caret: true,
  cross: true,
  ellipsis: true,
  envelope: true,
  exclamation: true,
  folder: true,
  'graduation-cap': true,
  hamburger: true,
  house: true,
  logout: true,
  'math-symbols': true,
  padlock: true,
  pencil: true,
  portrait: true,
  search: true,
  'word-bubbles': true,

  // Whiteboard
  drop: true,
  eraser: true,
  pen: true,
  trash: true,
  undo: true
}

export default {
  props: {
    icon: {
      type: String,
      required: true,
      validator: key => key in icons
    },
    color: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: '1em'
    }
  }
}
</script>

<style lang="scss" scoped>
.UpchieveIcon {
  color: $c-soft-black;
}
</style>
