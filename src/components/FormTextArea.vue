<script setup>
import { ref, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import {
  helpers,
  maxLength as maxLengthV,
  minLength as minLengthV,
  requiredIf,
} from '@vuelidate/validators'
import AnalyticsService from '@/services/AnalyticsService'

const props = defineProps({
  cols: { type: Number, default: 10 },
  rows: { type: Number, default: 10 },
  blurEvent: { type: String },
  isRequired: { type: Boolean, default: true },
  label: { type: String },
  maxLength: { type: Number },
  minLength: { type: Number },
  name: { type: String },
  placeholder: { type: String },
  testid: { type: String, default: '' },
  modelValue: { type: [String, Number], default: '' },
  readOnly: { type: Boolean, default: false },
  customError: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const hasEnteredText = ref(false)

const rules = computed(() => {
  const textValidations = {
    required: helpers.withMessage('Required', requiredIf(props.isRequired)),
  }
  if (props.minLength)
    textValidations.minLength = helpers.withMessage(
      `Must be at least ${props.minLength} characters long`,
      minLengthV(props.minLength)
    )
  if (props.maxLength)
    textValidations.maxLength = helpers.withMessage(
      `Must be no more than ${props.maxLength} characters`,
      maxLengthV(props.maxLength)
    )
  return { modelValue: textValidations }
})

const v$ = useVuelidate(rules, props)

function hasValidationError(customError = '') {
  return !!customError || v$.value.$error
}
function getValidationErrors(customError = '') {
  if (customError) return customError
  return v$.value.$errors.map((e) => e.$message).join(', ')
}

function onBlur() {
  v$.value.modelValue.$touch()
  if (props.modelValue && !hasEnteredText.value && props.blurEvent) {
    AnalyticsService.captureEvent(props.blurEvent)
    hasEnteredText.value = true
  }
}
</script>

<template>
  <div class="uc-form-element w-full">
    <div class="uc-row justify-between">
      <label
        :for="name"
        :class="{
          error: hasValidationError(customError),
        }"
        >{{ label }}</label
      >
      <div v-if="hasValidationError(customError)" class="error-caption">
        {{ getValidationErrors(customError) }}
      </div>
    </div>
    <textarea
      :cols="cols"
      :rows="rows"
      :id="name"
      :name="name"
      :data-testid="testid"
      autocomplete="off"
      class="uc-form-textarea"
      :class="{
        'uc-form-textarea-invalid': hasValidationError(customError),
      }"
      :placeholder="placeholder"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="onBlur"
      :required="isRequired"
      :disabled="readOnly"
      v-bind="$attrs"
    />
  </div>
</template>

<style lang="scss" scoped>
.uc-form-textarea {
  border: 1px solid $border-grey;
  border-radius: 4px;
  box-shadow: none;
  box-sizing: border-box;
  padding: 11px 13px;

  &:focus {
    outline: 1px solid $c-information-blue;
  }

  &-invalid {
    outline: 1px solid $c-error-red;
  }

  &::placeholder {
    color: $c-banned-grey;
  }
}
</style>
