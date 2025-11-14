<template>
  <a :href="url">{{ text }}</a>
</template>

<script setup lang="ts">
defineProps({
  url: { type: String, required: true },
  text: { type: String, required: true },
})
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
  color: $c-success-green;
  font-size: 16px;

  &:hover {
    color: darken($color: $c-success-green, $amount: 5%);
    svg {
      fill: darken($color: $c-success-green, $amount: 5%);
    }
  }
}
</style>
