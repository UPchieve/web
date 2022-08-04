<template>
  <div class="chip-item">
    {{ chipContent }}
  </div>
</template>

<script>
export default {
  name: 'Chip',
  props: {
    chipContent: {
      type: String,
      required: true,
    },
  },
}
</script>

<style lang="scss" scoped>
.chip-item {
  display: inline-block;
  padding: 0.5em 1em;
  font-size: 12px;
  color: #000;
  background-color: #fff;

  border-radius: 30px;
  border: 1px solid $c-border-grey;
}
</style>
