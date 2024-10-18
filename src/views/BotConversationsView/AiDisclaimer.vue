<script lang="ts" setup>
const props = defineProps<{
  message: string
}>()
</script>

<template>
  <span class="ai-disclaimer">{{ props.message }}</span>
</template>

<style lang="scss" scoped>
.ai-disclaimer {
  text-align: center;
  color: $c-default-grey;
  @include breakpoint-below('medium') {
    font-size: 12px;
  }
}
</style>
