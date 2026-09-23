<template>
  <div
    class="view-favorites-toggle"
    role="group"
    data-testid="favorites-only-toggle"
  >
    <button
      type="button"
      class="view-favorites-toggle__option"
      :class="{ 'view-favorites-toggle__option--active': !value }"
      :aria-pressed="!value"
      @click="setValue(false)"
    >
      {{ uncheckedLabel }}
    </button>
    <button
      type="button"
      class="view-favorites-toggle__option"
      :class="{ 'view-favorites-toggle__option--active': value }"
      :aria-pressed="value"
      @click="setValue(true)"
    >
      {{ checkedLabel }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Labels {
  checked: string
  unchecked: string
}

const props = withDefaults(
  defineProps<{
    value: boolean
    labels?: Labels
  }>(),
  {
    value: false,
    labels: () => ({ checked: 'On', unchecked: 'Off' }),
  }
)

const emit = defineEmits<{
  change: [{ value: boolean }]
}>()

const checkedLabel = computed(() => props.labels.checked)
const uncheckedLabel = computed(() => props.labels.unchecked)

function setValue(value: boolean) {
  if (value === props.value) return
  emit('change', { value })
}
</script>

<style lang="scss" scoped>
.view-favorites-toggle {
  display: inline-flex;
  align-items: center;
  background-color: #ecf0f5;

  border-radius: 10px;
  padding: 4px;

  &__option {
    @include font-category('body');
    border: none;
    background: transparent;
    color: $c-secondary-grey;
    padding: 0.5em 1.25em;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition:
      background-color 0.2s,
      color 0.2s;

    &--active {
      background-color: $upchieve-white;
      color: $c-soft-black;
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
