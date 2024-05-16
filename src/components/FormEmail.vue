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
      v-model="email"
      @input="$emit('input', $event.target.value)"
      @blur="onBlur"
      :required="isRequired"
      :autofocus="isAutofocused"
    />
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { helpers, requiredIf, email } from '@vuelidate/validators'
import { EVENTS } from '@/consts'
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
    testid: {
      type: String,
      default: '',
    },
  },

  setup() {
    return { v$: useVuelidate() }
  },

  data() {
    return {
      email: '',
      hasEnteredEmail: false,
    }
  },

  validations() {
    return {
      email: {
        required: helpers.withMessage('Required', requiredIf(this.isRequired)),
        email: helpers.withMessage('Not a valid email address', email),
      },
    }
  },

  methods: {
    onBlur() {
      this.v$.email.$touch()
      if (this.email && !this.hasEnteredEmail) {
        AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_EMAIL)
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
