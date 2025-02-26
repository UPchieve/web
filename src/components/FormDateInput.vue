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
      type="date"
      v-model="date"
      @input="$emit('update:modelValue', $event.target.value)"
      :required="isRequired"
      :min="formattedMinDate"
    />
  </div>
</template>

<script>
import { helpers, requiredIf } from '@vuelidate/validators'
import { useInputValidation } from '@/composables/InputValidation'
import moment from 'moment'

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
    placeholder: {
      type: Date,
    },
    name: {
      type: String,
    },
    modelValue: {
      type: Date,
    },
    minDate: {
      type: Date,
      default: null,
    },
  },
  emits: ['update:modelValue'],

  setup() {
    const { v$, hasValidationError, getValidationErrors } = useInputValidation()
    return { v$, hasValidationError, getValidationErrors }
  },

  data() {
    return {
      date: this.placeholder,
    }
  },

  computed: {
    formattedMinDate() {
      if (this.minDate instanceof Date) {
        return moment(this.minDate).format('YYYY-MM-DD')
      }
      return null
    },
  },

  validations() {
    const textValidations = {
      required: helpers.withMessage('Required', requiredIf(this.isRequired)),
    }

    return {
      text: textValidations,
    }
  },
}
</script>
