import type { Component } from 'vue'
import store from '@/store'
import SessionErrorModal from '@/views/SessionView/SessionErrorModal.vue'
import type { RemoveTeamMemberModalProps } from '@/components/NTHS/RemoveTeamMemberModal.vue'
import type { RemoveMemberConfirmationProps } from '@/views/NTHS/RemoveMemberConfirmation.vue'

type ModalTemplateProps = {
  acceptText?: string
  enableAccept?: boolean
  acceptButtonVariant?: string
  backText?: string
  alertModal?: boolean
  important?: boolean
  showTemplateButtons?: boolean
  showSeparator?: boolean
  showAccept?: boolean
  modalComponentName?: string
}

export type SessionErrorModalData = ModalTemplateProps & {
  onAccept?: () => void
  error: string
}

export type ConfirmModalData = ModalTemplateProps & {
  title: string
  message: string
  heroImageUrl?: string
  onConfirm?: () => void
  onCancel?: () => void
}

type ModalData = ModalTemplateProps | SessionErrorModalData | ConfirmModalData

// TODO: Make `component` just a string.
function show(
  component: Component | string,
  data: ModalData,
  componentProps = {}
): void {
  const modalComponentName =
    typeof component === 'string' ? component : (component as Component).name
  store.dispatch('app/modal/show', {
    component,
    data: {
      ...data,
      modalComponentName,
    },
    componentProps,
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

  showNthsUserManagementModal(props: RemoveTeamMemberModalProps) {
    show(
      'RemoveTeamMemberModal',
      {
        showAccept: false,
        showSeparator: false,
        showTemplateButtons: false,
      },
      props
    )
  },

  showLeaveTeamModal(props: RemoveMemberConfirmationProps) {
    show(
      'RemoveMemberConfirmation',
      {
        showAccept: false,
        showSeparator: false,
        showTemplateButtons: false,
      },
      props
    )
  },

  showConfirm(
    title: string,
    message: string,
    options?: {
      acceptText?: string
      acceptButtonVariant?: string
      backText?: string
      heroImageUrl?: string
    }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      show('ConfirmModal', {
        title,
        message,
        acceptText: options?.acceptText ?? 'Confirm',
        acceptButtonVariant: options?.acceptButtonVariant,
        showTemplateButtons: false,
        backText: options?.backText ?? 'Cancel',
        heroImageUrl: options?.heroImageUrl,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  },

  showAlert(
    title: string,
    message: string,
    options?: { acceptText?: string; acceptButtonVariant?: string }
  ): Promise<void> {
    return new Promise((resolve) => {
      show('ConfirmModal', {
        title,
        message,
        acceptText: options?.acceptText ?? 'OK',
        acceptButtonVariant: options?.acceptButtonVariant,
        showTemplateButtons: false,
        onConfirm: () => resolve(),
        onCancel: () => resolve(),
      })
    })
  },
}
