import type { Component } from 'vue'
import store from '@/store'
import SessionErrorModal from '@/views/SessionView/SessionErrorModal.vue'

type ModalTemplateProps = {
  acceptText?: string
  enableAccept?: boolean
  acceptButtonVariant?: string
  backText?: string
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

type ModalData = ModalTemplateProps | SessionErrorModalData

// TODO: Make `component` just a string.
function show(component: Component | string, data: ModalData): void {
  const modalComponentName =
    typeof component === 'string' ? component : (component as Component).name
  store.dispatch('app/modal/show', {
    component,
    data: {
      ...data,
      modalComponentName,
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

  showDeleteAccountConfirmation() {
    show('DeleteAccountConfirmationModal', {
      acceptText: 'Delete Account',
      acceptButtonVariant: 'danger',
    })
  },
}
