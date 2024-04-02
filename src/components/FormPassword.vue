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
      :placeholder="placeholder"
      type="password"
      v-model="password"
      @input="$emit('password', $event.target.value)"
      class="uc-form-text-input"
      :class="{
        'uc-form-text-input-invalid': hasValidationError(),
      }"
      @blur="onBlur"
      :required="isRequired"
    />
    <div
      class="metadata"
      :class="{
        'metadata error': hasValidationError(),
      }"
    >
      Must have at least one number, one uppercase letter, one lowercase letter,
      and be at least 8 characters long.
    </div>
  </div>
</template>

<script>
import { helpers, requiredIf } from '@vuelidate/validators'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import InputValidation from '@/mixins/InputValidation'

export default {
  props: {
    isRequired: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      default: 'Password',
    },
    name: {
      type: String,
      default: 'password',
    },
    placeholder: {
      type: String,
      default: 'Password',
    },
  },

  mixins: [InputValidation],

  data() {
    return {
      password: '',
      hasEnteredPassword: false,
    }
  },

  validations() {
    return {
      password: {
        required: helpers.withMessage('Required', requiredIf(this.isRequired)),
        isPasswordValid: helpers.regex(this.PASSWORD_PATTERN),
      },
    }
  },

  created() {
    this.PASSWORD_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/
  },

  methods: {
    onBlur() {
      this.v$.password.$touch()
      if (this.password && !this.hasEnteredPassword) {
        AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_PASSWORD)
        this.hasEnteredPassword = true
      }
    },
  },
}
</script>
