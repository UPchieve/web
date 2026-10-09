<template>
  <PasswordField
    :id="name"
    :name="name"
    :placeholder="placeholder"
    :data-testid="testid"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', String($event))"
    @blur="onBlur"
    :required="isRequired"
    :label="label"
    :error-message="getErrorMessage()"
    :requirements="
      modelValue && showPasswordRequirements ? passwordRequirements : undefined
    "
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { helpers, requiredIf, minLength } from '@vuelidate/validators'
import AnalyticsService from '@/services/AnalyticsService'
import PasswordField from '@/components/PresentationComponents/PasswordField.vue'

const PASSWORD_REQUIREMENTS = {
  hasEightCharacters: { label: 'At least 8 characters', rule: minLength(8) },
  hasUpperCase: { label: 'One uppercase letter', rule: helpers.regex(/[A-Z]/) },
  hasLowerCase: { label: 'One lowercase letter', rule: helpers.regex(/[a-z]/) },
  hasOneNumber: { label: 'One number', rule: helpers.regex(/[0-9]/) },
}

const props = defineProps({
  isRequired: { type: Boolean, default: true },
  label: { type: String, default: 'Password' },
  name: { type: String, default: 'password' },
  placeholder: { type: String, default: 'Password' },
  blurEvent: { type: String },
  testid: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  showPasswordRequirements: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const hasEnteredPassword = ref(false)

const rules = computed(() => {
  const passwordValidations = {
    required: helpers.withMessage('Required', requiredIf(props.isRequired)),
  }

  if (props.showPasswordRequirements) {
    for (const [key, { rule }] of Object.entries(PASSWORD_REQUIREMENTS)) {
      passwordValidations[key] = rule
    }
  }

  return { modelValue: passwordValidations }
})

const v$ = useVuelidate(rules, props)

const passwordRequirements = computed(() =>
  Object.entries(PASSWORD_REQUIREMENTS).map(([key, { label }]) => ({
    label,
    hasBeenMet: !v$.value.modelValue[key].$invalid,
  }))
)

function getErrorMessage() {
  const errors = v$.value.modelValue.$errors
  if (!errors.length) return ''
  return (
    errors.find((e) => e.$validator === 'required')?.$message ??
    "Doesn't meet requirements"
  )
}

function onBlur() {
  v$.value.modelValue.$touch()
  if (props.modelValue && !hasEnteredPassword.value && props.blurEvent) {
    AnalyticsService.captureEvent(props.blurEvent)
    hasEnteredPassword.value = true
  }
}
</script>
