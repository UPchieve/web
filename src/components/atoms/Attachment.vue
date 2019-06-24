<template>
  <li class="attachment">
    <span class="attachment__icon logout">I</span> {{ filename }}
  </li>
</template>

<script>
export default {
  props: {
    filename: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss">
.attachment {
  display: inline-block;
  padding: 4px;
}
.attachment__icon {
  color: $c-accent;
}
</style>
