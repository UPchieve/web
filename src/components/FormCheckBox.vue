<template>
  <div class="uc-form-checkbox">
    <input
      :id="name"
      :name="name"
      class="checkbox-input"
      type="checkbox"
      @change="onChange"
      :required="isRequired"
    />
    <label :for="name" class="checkbox-label">
      {{ label }}
    </label>
  </div>
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
  },
  emits: ['input'],

  setup() {
    const { v$, hasValidationError, getValidationErrors } = useInputValidation()
    return { v$, hasValidationError, getValidationErrors }
  },

  data() {
    return {
      isChecked: false,
    }
  },
  methods: {
    onChange(e) {
      this.isChecked = e.target.checked
      this.$emit('input', this.isChecked)
    },
  },

  validations() {
    return {
      isChecked: {
        required: requiredIf(this.isRequired),
        sameAs: sameAs(true),
      },
    }
  },
}
</script>
