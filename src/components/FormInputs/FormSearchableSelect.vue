<template>
  <div class="uc-form-element w-full">
    <div class="uc-row justify-between">
      <label :for="name">{{ props.label }}</label>
    </div>
    <div v-if="validationError" class="error-caption">
      {{ validationError }}
    </div>

    <div class="searchable-select-wrapper">
      <ion-input
        :id="props.name"
        class="select-input"
        v-model="searchTerm"
        @ion-input="onSearchChange"
        @ion-blur="handleBlur"
        @ion-focus="
          () => {
            showOptions = true
            highlightedOptionIndex = 0
          }
        "
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :value="displayValue"
        fill="outline"
        :required="props.isRequired"
        :class="{ invalid: validationError }"
        :aria-label="props.label"
        :aria-required="props.isRequired"
        @keydown="handleKeydown"
      />

      <div
        v-if="showOptions && filteredOptions.length > 0"
        class="options-dropdown"
      >
        <div
          v-for="(option, index) in filteredOptions"
          :key="getOptionKey(option)"
          :class="{ highlighted: index === highlightedOptionIndex }"
          class="option-item"
          :aria-selected="index === highlightedOptionIndex"
          @mousedown="selectOption(option)"
        >
          {{ getOptionText(option) }}
        </div>
      </div>

      <div
        v-if="
          showOptions &&
          filteredOptions.length === 0 &&
          searchTerm &&
          props.options.length
        "
        class="no-options"
      >
        No options found
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IonInput } from '@ionic/vue'
import { type PropType, ref, computed, onMounted } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  options: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  optionTextField: {
    type: String,
    required: false,
  },
  modelValue: {
    type: [String, Number, Array, Object],
  },
  disabled: {
    type: Boolean,
    required: false,
  },
  placeholder: {
    type: String,
    required: false,
  },
  reduce: {
    type: Function,
    required: false,
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const searchTerm = ref<string>('')
const showOptions = ref<boolean>(false)
const selectedOption = ref<any>('')
const validationError = ref<string | null>(null)
const highlightedOptionIndex = ref<number>(0)

onMounted(() => {
  if (props.modelValue) {
    const selectedOption = props.options.find((o) => {
      const optionToCompare = props.reduce ? props.reduce(o) : o
      return optionToCompare === props.modelValue
    })
    searchTerm.value = props.optionTextField
      ? selectedOption[props.optionTextField]
      : selectedOption
  }
})

const displayValue = computed(() => {
  if (selectedOption.value) {
    return getOptionText(selectedOption.value)
  }
  return searchTerm.value
})

const filteredOptions = computed(() => {
  if (!searchTerm.value.trim()) {
    return props.options
  }

  const query = searchTerm.value.toLowerCase()
  return props.options.filter((option) =>
    getOptionText(option).toLowerCase().includes(query)
  )
})

function getOptionText(option: any): string {
  if (props.optionTextField) {
    return option[props.optionTextField] || ''
  }
  return option
}

function getOptionKey(option: any): string {
  return getOptionText(option)
}

function getOptionValue(option: any): any {
  return props.reduce ? props.reduce(option) : option
}

function onSearchChange(event: CustomEvent) {
  const query = event.detail.value
  searchTerm.value = query

  if (query.trim() === '') {
    selectedOption.value = ''
    emit('update:modelValue', '')
    showOptions.value = true
  } else {
    showOptions.value = true
    highlightedOptionIndex.value = 0
  }
}

function selectOption(option: any) {
  selectedOption.value = option
  searchTerm.value = getOptionText(option)
  showOptions.value = false

  const value = getOptionValue(option)
  emit('update:modelValue', value)
  handleSelection()
}

function handleSelection() {
  const matchingOption = props.options.find(
    (opt) =>
      getOptionText(opt).toLowerCase() === searchTerm.value.trim().toLowerCase()
  )

  if (matchingOption) {
    selectedOption.value = matchingOption
    emit('update:modelValue', getOptionValue(matchingOption))
    validationError.value = null
  } else {
    selectedOption.value = ''
    emit('update:modelValue', '')

    if (props.isRequired) {
      validationError.value = 'Required'
    } else {
      validationError.value = ''
    }
  }
}
function handleBlur() {
  showOptions.value = false
  handleSelection()
}

function handleKeydown(event: KeyboardEvent) {
  if (!showOptions.value || filteredOptions.value.length === 0) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedOptionIndex.value =
      (highlightedOptionIndex.value + 1) % filteredOptions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedOptionIndex.value =
      (highlightedOptionIndex.value - 1 + filteredOptions.value.length) %
      filteredOptions.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const selected = filteredOptions.value[highlightedOptionIndex.value]
    if (selected) {
      selectOption(selected)
    }
  } else if (event.key === 'Escape') {
    showOptions.value = false
  }
}
</script>

<style lang="scss">
.native-input {
  font-size: 16px !important;
  color: #000 !important;
}

.input-wrapper {
  padding-left: 8px !important;
}
</style>

<style lang="scss" scoped>
.searchable-select-wrapper {
  position: relative;
}

ion-input {
  height: auto;
  min-height: 48px;
  margin: 0;
  border: 1px solid $border-grey;
  border-radius: 4px;
  box-shadow: none;
  box-sizing: border-box;
  width: 100%;
  position: relative;
  font-size: 16px;
  --highlight-color-focused: $border-grey;
  --border-width: 0;
  --border-color: transparent;
  --padding-start: 0;
  --padding-end: 0;
  --color: #000;
  background-color: #fff;

  &.input-fill-outline {
    min-height: 48px;
  }
}

ion-input.invalid {
  border: 1px solid $c-error-red !important;
}

.options-dropdown,
.no-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 2px;
  border: 1px solid $border-grey;
  background: white;
}

.options-dropdown {
  max-height: 400px;
  overflow-y: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-options {
  padding: 12px 16px;
  color: #666;
  font-style: italic;
  text-align: center;
  border-radius: 4px;
}

.option-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;

  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
}

.option-item.highlighted {
  background-color: $c-background-blue;
}
</style>
