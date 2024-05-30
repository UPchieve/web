<template>
  <div class="uc-form-element w-full">
    <div class="uc-row justify-between">
      <label
        :for="name"
        :class="{
          error: hasValidationError(),
        }"
        >{{ label }}</label
      >
      <div v-if="hasValidationError()" class="error-caption">
        {{ getValidationErrors() }}
      </div>
    </div>
    <input
      :id="name"
      :name="name"
      class="uc-form-text-input"
      :class="{
        'uc-form-text-input-invalid': hasValidationError(),
      }"
      type="text"
      :placeholder="placeholder"
      v-model="text"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="onBlur"
      :required="isRequired"
    />
  </div>
</template>

<script>
import {
  helpers,
  maxLength,
  minLength,
  requiredIf,
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
    modelValue: {
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
      text: '',
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

    return {
      text: textValidations,
    }
  },

  methods: {
    onBlur() {
      this.v$.text.$touch()
      if (this.text && !this.hasEnteredText) {
        AnalyticsService.captureEvent(this.blurEvent)
        this.hasEnteredText = true
      }
    },
  },
}
</script>
