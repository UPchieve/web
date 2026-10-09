<template>
  <TextField
    :id="name"
    :name="name"
    type="email"
    :placeholder="placeholder"
    :data-testid="testid"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', String($event))"
    @blur="onBlur"
    :required="isRequired"
    :autofocus="isAutofocused"
    :label="label"
    :metadata="metadata"
    :error-message="hasValidationError() ? getValidationErrors() : ''"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { helpers, requiredIf, email } from '@vuelidate/validators'
import AnalyticsService from '@/services/AnalyticsService'
import TextField from '@/components/PresentationComponents/TextField.vue'

const props = defineProps({
  isRequired: { type: Boolean, default: true },
  isAutofocused: { type: Boolean, default: false },
  label: { type: String, default: 'Email' },
  name: { type: String, default: 'email' },
  placeholder: { type: String, default: 'What is your email?' },
  blurEvent: { type: String },
  testid: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  metadata: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const hasEnteredEmail = ref(false)

const rules = computed(() => ({
  modelValue: {
    required: helpers.withMessage('Required', requiredIf(props.isRequired)),
    email: helpers.withMessage('Not a valid email address', email),
  },
}))

const v$ = useVuelidate(rules, props)

function hasValidationError() {
  return v$.value.$error
}
function getValidationErrors() {
  return v$.value.$errors.map((e) => e.$message).join(', ')
}

function onBlur() {
  v$.value.modelValue.$touch()
  if (props.modelValue && !hasEnteredEmail.value && props.blurEvent) {
    AnalyticsService.captureEvent(props.blurEvent)
    hasEnteredEmail.value = true
  }
}
</script>
