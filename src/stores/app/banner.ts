import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppBannerStore = defineStore('app/banner', () => {
  const component = ref<string | null>(null)
  const isShown = ref(false)

  function show(payload: { component?: string } = {}) {
    isShown.value = true
    component.value = payload.component ?? null
  }

  function hide() {
    isShown.value = false
    component.value = null
  }

  return { component, isShown, show, hide }
})
