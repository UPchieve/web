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
    <input
      :id="name"
      :name="name"
      :data-testid="testid"
      autocomplete="off"
      class="uc-form-text-input"
      :class="{
        'uc-form-text-input-invalid': hasValidationError(customError),
      }"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="onBlur"
      :required="isRequired"
      :max="maxValue"
      :min="minValue"
      :disabled="readOnly"
      v-bind="$attrs"
    />
  </div>
</template>

<script>
import {
  helpers,
  maxLength,
  minLength,
  requiredIf,
  minValue,
  maxValue,
} from '@vuelidate/validators'
import AnalyticsService from '@/services/AnalyticsService'
import { useInputValidation } from '@/composables/InputValidation'

export default {
  props: {
    blurEvent: {
      type: String,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
    },
    maxValue: {
      type: Number,
    },
    minValue: {
      type: Number,
    },
    maxLength: {
      type: Number,
    },
    minLength: {
      type: Number,
    },
    name: {
      type: String,
    },
    placeholder: {
      type: String,
    },
    testid: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
    modelValue: {
      type: [String, Number],
      default: '',
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    customError: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],

  setup() {
    const { v$, hasValidationError, getValidationErrors } = useInputValidation()
    return { v$, hasValidationError, getValidationErrors }
  },

  data() {
    return {
      hasEnteredText: false,
    }
  },

  validations() {
    const textValidations = {
      required: helpers.withMessage('Required', requiredIf(this.isRequired)),
    }

    if (this.minLength) {
      textValidations.minLength = helpers.withMessage(
        `Must be at least ${this.minLength} characters long`,
        minLength(this.minLength)
      )
    }
    if (this.maxLength) {
      textValidations.maxLength = helpers.withMessage(
        `Must be no more than ${this.maxLength} characters`,
        maxLength(this.maxLength)
      )
    }

    if (this.minValue && this.type === 'number')
      textValidations.minValue = helpers.withMessage(
        `Must be ${this.minValue} or greater`,
        minValue(this.minValue)
      )

    if (this.maxValue && this.type === 'number')
      textValidations.maxValue = helpers.withMessage(
        `Must be ${this.maxValue} or smaller`,
        maxValue(this.maxValue)
      )

    return {
      modelValue: textValidations,
    }
  },

  methods: {
    onBlur() {
      this.v$.modelValue.$touch()
      if (this.modelValue && !this.hasEnteredText && this.blurEvent) {
        AnalyticsService.captureEvent(this.blurEvent)
        this.hasEnteredText = true
      }
    },
  },
}
</script>
