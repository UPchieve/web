<script lang="ts" setup>
import SearchIcon from '@/assets/search.svg'

withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    ariaLabel?: string
  }>(),
  {
    placeholder: 'Search by name',
    ariaLabel: 'Search by name',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label class="search-input">
    <SearchIcon class="search-input__icon" aria-hidden="true" />
    <input
      type="search"
      class="search-input__field"
      data-testid="search-input"
      autocomplete="off"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      @input="onInput"
    />
  </label>
</template>

<style lang="scss" scoped>
.search-input {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  box-sizing: border-box;
  width: 220px;
  height: 40px;
  margin: 0;
  padding: 0 1em;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
  background-color: $upchieve-white;
  cursor: text;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $c-information-blue;
  }

  &__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;

    :deep(path) {
      fill: $c-secondary-grey;
    }
  }

  &__field {
    @include font-category('body');
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: $c-soft-black;
    font-size: 14px;

    &::placeholder {
      color: $c-secondary-grey;
    }

    &::-webkit-search-cancel-button {
      appearance: none;
    }
  }
}
</style>
