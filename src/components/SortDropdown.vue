<script lang="ts" setup generic="T extends string">
import { computed, ref, useId } from 'vue'
import ArrowDownUpIcon from '@/assets/arrow-down-up.svg'

export interface SortOption<V extends string = string> {
  value: V
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: SortOption<T>[]
    ariaLabel?: string
  }>(),
  {
    ariaLabel: 'Sort',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

const isOpen = ref(false)
// Each dropdown needs its own radio group name so two on a page don't share one
const radioName = `sort-${useId()}`

const buttonLabel = computed(
  () =>
    props.options.find((option) => option.value === props.modelValue)?.label ??
    props.options[0]?.label ??
    ''
)

function select(value: T) {
  isOpen.value = false
  if (value !== props.modelValue) emit('update:modelValue', value)
}
</script>

<template>
  <v-menu
    v-model="isOpen"
    location="bottom end"
    :offset="8"
    :close-on-content-click="false"
  >
    <template #activator="{ props: activatorProps }">
      <button
        v-bind="activatorProps"
        type="button"
        class="sort-dropdown__button"
        :class="{ 'sort-dropdown__button--open': isOpen }"
        data-testid="sort-dropdown-button"
        aria-haspopup="true"
        :aria-expanded="isOpen"
        :aria-label="`${ariaLabel}: ${buttonLabel}`"
      >
        <ArrowDownUpIcon class="sort-dropdown__icon" aria-hidden="true" />
        <span>{{ buttonLabel }}</span>
      </button>
    </template>

    <div
      class="sort-dropdown__menu"
      role="radiogroup"
      :aria-label="ariaLabel"
      data-testid="sort-dropdown-menu"
    >
      <label
        v-for="option in options"
        :key="option.value"
        class="sort-dropdown__option"
        :data-testid="`sort-dropdown-option-${option.value}`"
      >
        <input
          type="radio"
          class="sort-dropdown__radio"
          :name="radioName"
          :value="option.value"
          :checked="option.value === modelValue"
          @change="select(option.value)"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
  </v-menu>
</template>

<style lang="scss" scoped>
.sort-dropdown {
  &__button {
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
      border-color 0.2s;

    &:hover {
      background-color: $c-background-grey;
    }

    &--open,
    &:focus-visible {
      outline: none;
      border-color: $c-information-blue;
    }
  }

  &__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &__menu {
    display: flex;
    flex-direction: column;
    min-width: 200px;
    padding: 12px 16px;
    background-color: $upchieve-white;
    border: 1px solid $c-border-grey;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 0.75em;
    padding: 0.5em 0;
    font-size: 14px;
    color: $c-soft-black;
    cursor: pointer;
  }

  &__radio {
    width: 18px;
    height: 18px;
    margin: 0;
    flex-shrink: 0;
    accent-color: $c-information-blue;
    cursor: pointer;
  }
}
</style>
