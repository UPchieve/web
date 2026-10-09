import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppSidebarStore = defineStore('app/sidebar', () => {
  const isShown = ref(false)
  const isCollapsed = ref(true)

  function collapse() {
    isCollapsed.value = true
  }

  function expand() {
    isCollapsed.value = false
  }

  function show() {
    collapse()
    isShown.value = true
  }

  function hide() {
    collapse()
    isShown.value = false
  }

  return { isShown, isCollapsed, collapse, expand, show, hide }
})
