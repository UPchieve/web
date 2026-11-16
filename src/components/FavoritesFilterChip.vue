<script lang="ts" setup>
import StarIcon from '@/assets/icons/star_icon.svg'
import StarFilledIcon from '@/assets/icons/star_icon_filled.svg'

const props = withDefaults(
  defineProps<{
    value: boolean
    label?: string
  }>(),
  {
    value: false,
    label: 'Favorites',
  }
)

const emit = defineEmits<{
  change: [{ value: boolean }]
}>()

function toggle() {
  emit('change', { value: !props.value })
}
</script>

<template>
  <button
    type="button"
    class="favorites-chip"
    :class="{ 'favorites-chip--active': value }"
    :aria-pressed="value"
    data-testid="favorites-only-toggle"
    @click="toggle"
  >
    <StarFilledIcon
      v-if="value"
      class="favorites-chip__icon"
      aria-hidden="true"
    />
    <StarIcon v-else class="favorites-chip__icon" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>

<style lang="scss" scoped>
.favorites-chip {
  @include font-category('body');
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  height: 40px;
  padding: 0 1.25em 0 1em;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
  background-color: $upchieve-white;
  color: $c-soft-black;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;

  &:hover {
    background-color: $c-background-grey;
  }

  &__icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;

    :deep(path) {
      fill: $c-soft-black;
    }
  }

  &--active {
    border-color: $c-information-blue;
    color: $c-information-blue;

    .favorites-chip__icon :deep(path) {
      fill: $c-information-blue;
    }
  }

  &:focus-visible {
    outline: none;
    border-color: $c-information-blue;
  }
}
</style>
