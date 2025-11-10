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
        {{ getRequiredError() }}
      </div>
    </div>
    <input
      :id="name"
      :data-testid="testid"
      :name="name"
      :placeholder="placeholder"
      type="password"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="uc-form-text-input"
      :class="{
        'uc-form-text-input-invalid': hasValidationError(),
      }"
      @blur="onBlur"
      :required="isRequired"
    />

    <div v-if="modelValue && showPasswordRequirements" class="password-requirements">
      <div
        v-for="(validation, key) in passwordValidationRules"
        :key="key"
        class="requirement"
        :class="{ valid: !validation.$invalid, invalid: validation.$invalid }"
      >
        <span class="requirement-icon">{{
          !validation.$invalid ? '✓' : '○'
        }}</span>
        {{ validation.$message }}
      </div>
    </div>

    <div
      v-if="metadata"
      class="metadata"
      :class="{
        'metadata error': hasValidationError(),
      }"
    >
      {{ metadata }}
    </div>
  </div>
</template>

<script>
import { helpers, requiredIf, minLength } from '@vuelidate/validators'
import AnalyticsService from '@/services/AnalyticsService'
import { useInputValidation } from '@/composables/InputValidation'

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
    metadata: {
      type: String,
      default: '',
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
    showPasswordRequirements: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue'],

  setup() {
    const { v$, hasValidationError, getValidationErrors } = useInputValidation()
    return { v$, hasValidationError, getValidationErrors }
  },

  data() {
    return {
      hasEnteredPassword: false,
    }
  },

  computed: {
    passwordValidationRules() {
      const rules = this.v$.modelValue
      return {
        hasEightCharacters: rules.hasEightCharacters,
        hasUpperCase: rules.hasUpperCase,
        hasLowerCase: rules.hasLowerCase,
        hasOneNumber: rules.hasOneNumber,
      }
    },
  },

  validations() {
    const uppercaseLetters = /[A-Z]/
    const lowercaseLetters = /[a-z]/
    const numbers = /[0-9]/
    const passwordValidations = {
      required: helpers.withMessage('Required', requiredIf(this.isRequired)),
      hasEightCharacters: helpers.withMessage(
        'At least 8 characters',
        minLength(8)
      ),
      hasUpperCase: helpers.withMessage(
        'One uppercase letter',
        helpers.regex(uppercaseLetters)
      ),
      hasLowerCase: helpers.withMessage(
        'One lowercase letter',
        helpers.regex(lowercaseLetters)
      ),
      hasOneNumber: helpers.withMessage('One number', helpers.regex(numbers)),
    }

    return {
      modelValue: passwordValidations,
    }
  },

  methods: {
    onBlur() {
      this.v$.modelValue.$touch()
      if (this.modelValue && !this.hasEnteredPassword && this.blurEvent) {
        AnalyticsService.captureEvent(this.blurEvent)
        this.hasEnteredPassword = true
      }
    },
    getRequiredError() {
      const requiredError = this.v$.modelValue.$errors.find(
        (e) => e.$validator === 'required'
      )
      return requiredError ? requiredError.$message : ''
    },
  },
}
</script>

<style lang="scss" scoped>
.password-requirements {
  margin-top: 8px;
  font-size: 0.875rem;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  transition: color 0.2s ease;
}

.requirement.valid {
  color: $c-success-green;
}

.requirement.invalid {
  color: $c-error-red;
}

.requirement-icon {
  font-weight: bold;
  font-size: 1rem;
}
</style>
