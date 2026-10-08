<template>
  <TextField
    :id="name"
    :name="name"
    :placeholder="placeholder"
    :data-testid="testid"
    :type="type"
    :model-value="textFieldValue"
    @update:model-value="$emit('update:modelValue', String($event))"
    @blur="onBlur"
    :required="isRequired"
    :max="maxValue"
    :min="minValue"
    :disabled="readOnly"
    :label="label"
    :error-message="
      hasValidationError(customError) ? getValidationErrors(customError) : ''
    "
  />
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
import TextField from '@/components/PresentationComponents/TextField.vue'

export default {
  components: { TextField },
  props: {
    blurEvent: {
      type: String,
    },
    blurEventProperties: {
      type: Object,
      default: () => ({}),
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

  computed: {
    // v-model casts number inputs to number, but we want to emit strings here
    // if the value is a number, then we want to stringify it
    textFieldValue() {
      if (this.type !== 'number') return this.modelValue
      const num = parseFloat(this.modelValue)
      return isNaN(num) ? this.modelValue : num
    },
  },

  methods: {
    onBlur() {
      this.v$.modelValue.$touch()
      if (this.modelValue && !this.hasEnteredText && this.blurEvent) {
        AnalyticsService.captureEvent(this.blurEvent, this.blurEventProperties)
        this.hasEnteredText = true
      }
    },
  },
}
</script>
