<template>
  <CheckboxField
    :id="name"
    :name="name"
    :label="label"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :required="isRequired"
  />
</template>

<script>
import { requiredIf, sameAs } from '@vuelidate/validators'
import { useInputValidation } from '@/composables/InputValidation'
import CheckboxField from '@/components/PresentationComponents/CheckboxField.vue'

export default {
  components: { CheckboxField },
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

  validations() {
    const checkboxValidations = {
      required: requiredIf(this.isRequired),
    }

    // Vuelidate's `required` accepts `false`, so a required checkbox also has
    // to be checked. Optional checkboxes can be left unchecked.
    if (this.isRequired) checkboxValidations.sameAs = sameAs(true)

    return {
      modelValue: checkboxValidations,
    }
  },
}
</script>
