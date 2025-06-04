import { useVuelidate } from '@vuelidate/core'
import { ref } from 'vue'

export function useInputValidation() {
  const v$ = ref(useVuelidate())

  function hasValidationError(customError = '') {
    return !!customError || v$.value.$error
  }
  function getValidationErrors(customError = '') {
    if (customError) return customError
    return v$.value.$errors.map((e) => e.$message).join(', ')
  }

  return { v$, hasValidationError, getValidationErrors }
}
