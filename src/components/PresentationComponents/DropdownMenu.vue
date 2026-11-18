<script lang="ts" setup>
import { computed, useSlots } from 'vue'

withDefaults(
  defineProps<{
    label: string
    active?: boolean
    buttonAriaLabel?: string
    menuRole?: string
    menuAriaLabel?: string
    testId?: string
  }>(),
  {
    active: false,
    buttonAriaLabel: undefined,
    menuRole: undefined,
    menuAriaLabel: undefined,
    testId: 'dropdown-menu',
  }
)

const isOpen = defineModel<boolean>('open', { default: false })

const slots = useSlots()
const hasLeadingIcon = computed(() => !!slots['leading-icon'])
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
        class="dropdown-menu__button"
        :class="{
          'dropdown-menu__button--leading-icon': hasLeadingIcon,
          'dropdown-menu__button--active': active,
          'dropdown-menu__button--open': isOpen,
        }"
        :data-testid="`${testId}-button`"
        aria-haspopup="true"
        :aria-expanded="isOpen"
        :aria-label="buttonAriaLabel"
      >
        <slot name="leading-icon" :is-open="isOpen" />
        <span>{{ label }}</span>
        <slot name="trailing-icon" :is-open="isOpen" />
      </button>
    </template>

    <div
      class="dropdown-menu__panel"
      :role="menuRole"
      :aria-label="menuAriaLabel"
      :data-testid="`${testId}-menu`"
    >
      <slot />
    </div>
  </v-menu>
</template>

<style lang="scss" scoped>
.dropdown-menu {
  &__button {
    @include font-category('helper-text');
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    height: 40px;
    padding: 0 $spacing-sm 0 $spacing-md;
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

    &--leading-icon {
      padding: 0 $spacing-md 0 $spacing-sm;
    }

    &--active {
      border-color: $c-information-blue;
      color: $c-information-blue;
    }

    &--open,
    &:focus-visible {
      outline: none;
      border-color: $c-information-blue;
    }
  }

  &__panel {
    display: flex;
    flex-direction: column;
    min-width: 200px;
    padding: $spacing-xs $spacing-sm;
    background-color: $upchieve-white;
    border: 1px solid $c-border-grey;
    border-radius: $radius-md;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}
</style>
