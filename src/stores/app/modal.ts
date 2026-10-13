import { ref, shallowRef, type Component } from 'vue'
import { defineStore } from 'pinia'

// TODO: Replace the `any`s once the modal components have typed props.
type ModalTemplateProps = any
type ComponentProps = any

export type AppModalPayload = {
  component?: Component | string
  data?: ModalTemplateProps
  modalTemplateProps?: ModalTemplateProps
  componentProps?: ComponentProps
}

export const useAppModalStore = defineStore('app/modal', () => {
  // shallowRef: this holds a component definition, which must not be made reactive.
  const component = shallowRef<Component | string | null>(null)
  const modalTemplateProps = ref<ModalTemplateProps>({})
  const componentProps = ref<ComponentProps>({})
  const isShown = ref(false)

  function show(payload: AppModalPayload = {}) {
    isShown.value = true
    component.value = payload.component ?? null
    modalTemplateProps.value = payload.data ?? {}
    componentProps.value = payload.componentProps ?? {}
  }

  function update(payload: AppModalPayload = {}) {
    modalTemplateProps.value = {
      ...modalTemplateProps.value,
      ...(payload.modalTemplateProps ?? {}),
    }
    componentProps.value = {
      ...componentProps.value,
      ...(payload.componentProps ?? {}),
    }
  }

  function hide() {
    isShown.value = false
    component.value = null
    modalTemplateProps.value = {}
    componentProps.value = {}
  }

  return {
    component,
    modalTemplateProps,
    componentProps,
    isShown,
    show,
    update,
    hide,
  }
})
