import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppHeaderStore = defineStore('app/header', () => {
  const isShown = ref(false)

  function setIsShown(value: boolean) {
    isShown.value = value
  }

  return { isShown, setIsShown }
})
