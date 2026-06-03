<template>
  <label class="uc-form-checkbox" :for="name">
    <input
      :id="name"
      :name="name"
      class="checkbox-input"
      type="checkbox"
      :checked="modelValue"
      @change="onChange"
      :required="isRequired"
    />
    <span class="checkbox-label">
      {{ label }}
    </span>
  </label>
</template>

<script>
import { requiredIf, sameAs } from '@vuelidate/validators'
import { useInputValidation } from '@/composables/InputValidation'

export default {
  props: {
    isRequired: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: 'checkbox',
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],

  setup() {
    const { v$, hasValidationError, getValidationErrors } = useInputValidation()
    return { v$, hasValidationError, getValidationErrors }
  },

  methods: {
    onChange(e) {
      this.$emit('update:modelValue', e.target.checked)
    },
  },

  validations() {
    return {
      modelValue: {
        required: requiredIf(this.isRequired),
        sameAs: sameAs(true),
      },
    }
  },
}
</script>

<style lang="scss" scoped>
.checkbox-label {
  margin-left: 8px;
}
</style>
