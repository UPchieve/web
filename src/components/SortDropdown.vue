<script lang="ts" setup generic="T extends string">
import { computed, ref } from 'vue'
import ArrowDownUpIcon from '@/assets/arrow-down-up.svg'
import DropdownMenu from '@/components/PresentationComponents/DropdownMenu.vue'

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
  <DropdownMenu
    v-model:open="isOpen"
    :label="buttonLabel"
    :button-aria-label="`${ariaLabel}: ${buttonLabel}`"
    menu-role="menu"
    :menu-aria-label="ariaLabel"
    test-id="sort-dropdown"
  >
    <template #leading-icon>
      <ArrowDownUpIcon class="sort-dropdown__icon" aria-hidden="true" />
    </template>

    <p class="sort-dropdown__heading" aria-hidden="true">Sort by</p>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="menuitemradio"
      class="sort-dropdown__option"
      :class="{
        'sort-dropdown__option--selected': option.value === modelValue,
      }"
      :aria-checked="option.value === modelValue"
      :data-testid="`sort-dropdown-option-${option.value}`"
      @click="select(option.value)"
    >
      <span
        class="sort-dropdown__radio"
        :class="{
          'sort-dropdown__radio--checked': option.value === modelValue,
        }"
        data-testid="sort-dropdown-radio"
        aria-hidden="true"
      />
      <span>{{ option.label }}</span>
    </button>
  </DropdownMenu>
</template>

<style lang="scss" scoped>
.sort-dropdown {
  &__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &__heading {
    margin: 0.25em 0;
    font-size: 14px;
    font-weight: 500;
    color: $c-secondary-grey;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 0.75em;
    margin: 0 (-$spacing-sm);
    padding: 0.5em $spacing-sm;
    border: none;
    background: transparent;
    font: inherit;
    font-size: 14px;
    color: $c-soft-black;
    text-align: left;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      outline: none;
      background-color: $c-background-grey;
    }

    &--selected {
      color: $c-information-blue;
    }
  }

  &__radio {
    position: relative;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border: 2px solid $c-secondary-grey;
    border-radius: 50%;
    background-color: $upchieve-white;

    &--checked {
      border-color: $c-information-blue;

      &::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        background-color: $c-information-blue;
      }
    }
  }
}
</style>
