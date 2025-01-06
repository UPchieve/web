import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export function useStepper(totalStepsRef: Ref<number>) {
  const currentStep = ref(1)

  const isFirstStep = computed(() => currentStep.value === 1)
  const isLastStep = computed(() => currentStep.value === totalStepsRef.value)

  function nextStep() {
    if (!isLastStep.value) currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 1) currentStep.value--
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= totalStepsRef.value) currentStep.value = step
  }

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    goToStep,
  }
}
