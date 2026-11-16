<script lang="ts" setup>
import { computed, ref } from 'vue'
import ChevronDownIcon from '@/assets/chevron-down.svg'
import type { MessageFilterOption } from '@/types/direct-messages'

const props = withDefaults(
  defineProps<{
    modelValue: MessageFilterOption[]
    counts: Record<MessageFilterOption, number>
    defaultLabel?: string
  }>(),
  {
    defaultLabel: 'All coaches',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: MessageFilterOption[]]
}>()

const options: { value: MessageFilterOption; label: string }[] = [
  { value: 'new', label: 'New message' },
  { value: 'none', label: 'No new messages' },
]

const isOpen = ref(false)

const isActive = computed(() => props.modelValue.length === 1)

const buttonLabel = computed(() => {
  if (!isActive.value) return props.defaultLabel
  return (
    options.find((option) => option.value === props.modelValue[0])?.label ??
    props.defaultLabel
  )
})

function isChecked(value: MessageFilterOption) {
  return props.modelValue.includes(value)
}

function toggleOption(value: MessageFilterOption) {
  const next = isChecked(value)
    ? props.modelValue.filter((selected) => selected !== value)
    : [...props.modelValue, value]
  emit(
    'update:modelValue',
    options.map((option) => option.value).filter((v) => next.includes(v))
  )
}

function clear() {
  emit('update:modelValue', [])
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
        class="message-filter__button"
        :class="{
          'message-filter__button--active': isActive,
          'message-filter__button--open': isOpen,
        }"
        data-testid="message-filter-button"
        aria-haspopup="true"
        :aria-expanded="isOpen"
      >
        <span>{{ buttonLabel }}</span>
        <ChevronDownIcon
          class="message-filter__chevron"
          :class="{ 'message-filter__chevron--open': isOpen }"
          aria-hidden="true"
        />
      </button>
    </template>

    <div
      class="message-filter__menu"
      role="group"
      aria-label="Filter by messages"
      data-testid="message-filter-menu"
    >
      <label
        v-for="option in options"
        :key="option.value"
        class="message-filter__option"
        :data-testid="`message-filter-option-${option.value}`"
      >
        <input
          type="checkbox"
          class="message-filter__checkbox"
          :checked="isChecked(option.value)"
          @change="toggleOption(option.value)"
        />
        <span
          class="message-filter__dot"
          :class="`message-filter__dot--${option.value}`"
          aria-hidden="true"
        />
        <span class="message-filter__label">{{ option.label }}</span>
        <span class="message-filter__count">{{ counts[option.value] }}</span>
      </label>
      <button
        type="button"
        class="message-filter__clear"
        data-testid="message-filter-clear"
        :disabled="modelValue.length === 0"
        @click="clear"
      >
        Clear
      </button>
    </div>
  </v-menu>
</template>

<style lang="scss" scoped>
.message-filter {
  &__button {
    @include font-category('body');
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    height: 40px;
    padding: 0 1em 0 1.25em;
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

  &__chevron {
    width: 16px;
    height: 16px;
    transition: transform 0.2s;

    &--open {
      transform: rotate(180deg);
    }
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

  &__checkbox {
    width: 18px;
    height: 18px;
    margin: 0;
    flex-shrink: 0;
    accent-color: $c-information-blue;
    cursor: pointer;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--new {
      background-color: $c-warning-orange;
    }

    &--none {
      background-color: $c-disabled-grey;
    }
  }

  &__label {
    flex: 1;
  }

  &__count {
    margin-left: 1em;
    color: $c-secondary-grey;
  }

  &__clear {
    align-self: flex-end;
    margin-top: 0.5em;
    padding: 0;
    border: none;
    background: transparent;
    color: $c-information-blue;
    font-size: 14px;
    cursor: pointer;

    &:disabled {
      color: $c-disabled-grey;
      cursor: default;
    }
  }
}
</style>
