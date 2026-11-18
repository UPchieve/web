<script lang="ts" setup>
withDefaults(
  defineProps<{
    active?: boolean
  }>(),
  {
    active: false,
  }
)
</script>

<template>
  <button
    type="button"
    class="toggle-chip"
    :class="{ 'toggle-chip--active': active }"
    :aria-pressed="active"
  >
    <slot name="icon" />
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.toggle-chip {
  @include font-category('helper-text');
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  height: 40px;
  padding: 0 $spacing-md 0 $spacing-sm;
  border: 1px solid $c-border-grey;
  border-radius: $radius-lg;
  background-color: $upchieve-white;
  color: $c-soft-black;
  font-weight: $font-weight-medium;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;

  &:hover {
    background-color: $c-background-grey;
  }

  &--active {
    border-color: $c-information-blue;
    box-shadow: inset 0 0 0 1px $c-information-blue;
    color: $c-information-blue;
  }

  &:focus-visible {
    outline: none;
    border-color: $c-information-blue;
  }
}
</style>
