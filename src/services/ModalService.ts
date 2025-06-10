import type { Component } from 'vue'
import store from '@/store'
import SessionErrorModal from '@/views/SessionView/SessionErrorModal.vue'

type ModalTemplateProps = {
  acceptText?: string
  backText?: string
  enableAccept?: boolean
  alertModal?: boolean
  important?: boolean
  showTemplateButtons?: boolean
  showAccept?: boolean
  modalComponentName?: string
}

export type SessionErrorModalData = ModalTemplateProps & {
  onAccept?: () => void
  error: string
}

type ModalData = SessionErrorModalData

function show(component: Component, data: ModalData): void {
  store.dispatch('app/modal/show', {
    component,
    data: {
      ...data,
      modalComponentName: component.name,
    },
  })
}

export default {
  showSessionError(error: string, action?: () => void): void {
    show(SessionErrorModal, {
      error,
      alertModal: true,
      acceptText: 'OK',
      onAccept: action,
    })
  },
}
