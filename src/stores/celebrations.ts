import { ref } from 'vue'
import { defineStore } from 'pinia'

export type Celebration = {
  id: number
  duration: number
}

export const DEFAULT_CELEBRATION_DURATION = 2200
const MAX_CONFETTI_TRIGGERS = 3

export const useCelebrationsStore = defineStore('celebrations', () => {
  const confettiCelebrations = ref<Celebration[]>([])

  function addConfetti(celebration: Celebration) {
    if (confettiCelebrations.value.length >= MAX_CONFETTI_TRIGGERS) {
      return
    }
    confettiCelebrations.value = [...confettiCelebrations.value, celebration]
  }

  function removeConfetti(id: number) {
    confettiCelebrations.value = confettiCelebrations.value.filter(
      (c) => c.id !== id
    )
  }

  function celebrate(duration = DEFAULT_CELEBRATION_DURATION) {
    const id = Date.now()
    addConfetti({ id, duration })
    setTimeout(() => {
      removeConfetti(id)
    }, duration)
  }

  return { confettiCelebrations, celebrate }
})
