import { useVuelidate } from '@vuelidate/core'
import { ref } from 'vue'

export function useInputValidation() {
  const v$ = ref(useVuelidate())

  function hasValidationError() {
    return v$.value.$error
  }
  function getValidationErrors() {
    return v$.value.$errors.map((e) => e.$message).join(', ')
  }

  return { v$, hasValidationError, getValidationErrors }
}
