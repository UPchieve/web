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
      :data-testid="testid"
      :name="name"
      class="uc-form-text-input"
      :class="{
        'uc-form-text-input-invalid': hasValidationError(),
      }"
      type="email"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="onBlur"
      :required="isRequired"
      :autofocus="isAutofocused"
    />
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { helpers, requiredIf, email } from '@vuelidate/validators'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  props: {
    isRequired: {
      type: Boolean,
      default: true,
    },
    isAutofocused: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: 'Email',
    },
    name: {
      type: String,
      default: 'email',
    },
    placeholder: {
      type: String,
      default: 'What is your email?',
    },
    blurEvent: {
      type: String,
    },
    testid: {
      type: String,
      default: '',
    },
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],

  setup() {
    return { v$: useVuelidate() }
  },

  data() {
    return {
      hasEnteredEmail: false,
    }
  },

  validations() {
    return {
      modelValue: {
        required: helpers.withMessage('Required', requiredIf(this.isRequired)),
        email: helpers.withMessage('Not a valid email address', email),
      },
    }
  },

  methods: {
    onBlur() {
      this.v$.modelValue.$touch()
      if (this.modelValue && !this.hasEnteredEmail && this.blurEvent) {
        AnalyticsService.captureEvent(this.blurEvent)
        this.hasEnteredEmail = true
      }
    },
    hasValidationError() {
      return this.v$.$error
    },
    getValidationErrors() {
      return this.v$.$errors.map((e) => e.$message).join(', ')
    },
  },
}
</script>
