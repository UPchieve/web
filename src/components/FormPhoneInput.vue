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
    <maz-phone-number-input
      :id="name"
      :data-testid="testid"
      class="phone-input"
      :class="{
        'phone-input-invalid': hasValidationError(customError),
      }"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      @update="onPhoneUpdate"
      @blur="onBlur"
      show-code-on-list
      :disabled="readOnly"
    />
    <p v-if="subtext" class="uc-form-subtext">
      {{ subtext }}
    </p>
  </div>
</template>

<script>
import { helpers, requiredIf } from '@vuelidate/validators'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import AnalyticsService from '@/services/AnalyticsService'
import { useInputValidation } from '@/composables/InputValidation'

export default {
  components: {
    MazPhoneNumberInput,
  },

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
    name: {
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
    readOnly: {
      type: Boolean,
      default: false,
    },
    customError: {
      type: String,
      default: '',
    },
    subtext: {
      type: String,
      default: '',
    },
  },

  emits: ['update:modelValue', 'update'],

  setup() {
    const { v$, hasValidationError, getValidationErrors } = useInputValidation()
    return { v$, hasValidationError, getValidationErrors }
  },

  data() {
    return {
      hasEnteredText: false,
      phoneData: null,
    }
  },

  validations() {
    const phoneValidations = {
      required: helpers.withMessage('Required', requiredIf(this.isRequired)),
      validPhone: helpers.withMessage(
        'Please enter a valid phone number',
        (value) => {
          if (!this.isRequired && !value) return true
          return this.phoneData?.isValid || false
        }
      ),
    }

    return {
      modelValue: phoneValidations,
    }
  },

  methods: {
    onPhoneUpdate(phoneData) {
      this.phoneData = phoneData
      this.$emit('update', phoneData)
      // Trigger validation when phone data updates
      if (this.v$.modelValue.$dirty) {
        this.v$.modelValue.$touch()
      }
    },

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

<style lang="scss">
.m-input-wrapper {
  width: 100%;
}
</style>
<style lang="scss" scoped>
.m-input-wrapper {
  width: 100%;
}
.phone-input {
  margin: 10px 0 2px;
  width: 100%;
  :deep(.m-input-wrapper) {
    width: 100%;
  }
}
</style>
