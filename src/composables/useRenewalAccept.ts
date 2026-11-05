import { computed, ref } from 'vue'
import { toastController } from '@ionic/vue'
import { useNthsStore } from '@/stores/nths'
import LoggerService from '@/services/LoggerService'
import { secondsInMs } from '@/utils/time-utils'
import { isNetworkError } from '@/services/NetworkService'
import {
  renewalAcceptedToast,
  renewalErrorMessage,
} from '@/services/NTHSRenewalService'
import type {
  NTHSAcceptanceOutcome,
  NTHSRenewalCommitments,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

type Send = (commitments: NTHSRenewalCommitments) => Promise<unknown>

export function useRenewalAccept(
  groupId: () => string,
  // Resolves undefined when the caller backs out of the commitments.
  askCommitments: () => Promise<NTHSRenewalCommitments | undefined>
) {
  const nths = useNthsStore()
  const group = computed(() =>
    nths.NTHSGroups.find(
      (g: { groupInfo: { id: string } }) => g.groupInfo.id === groupId()
    )
  )
  const renewal = computed<NTHSRenewalPublic | undefined>(
    () => group.value?.renewal
  )
  const chapterName = computed<string>(
    () => group.value?.groupInfo?.name ?? 'your chapter'
  )
  const isSubmitting = ref(false)
  const errorMessage = ref('')

  async function showToast(message: string) {
    const toast = await toastController.create({
      message,
      color: 'light',
      cssClass: 'app-font',
      duration: secondsInMs(5),
      position: 'top',
    })
    await toast.present()
  }

  async function handleFailure(err: unknown) {
    errorMessage.value = renewalErrorMessage(err)
    if (!(isNetworkError(err) && err.clientMessage)) {
      LoggerService.noticeError(err, 'Could not save NTHS renewal')
    }
    try {
      await nths.refreshNTHSGroups()
    } catch (refreshErr) {
      LoggerService.noticeError(refreshErr, 'Could not refresh NTHS groups')
    }
  }

  function reloadNthsData() {
    void nths.fetchNthsData().catch((err) => {
      LoggerService.noticeError(err, 'Could not refresh NTHS data')
    })
  }

  async function save(send: Send): Promise<boolean> {
    errorMessage.value = ''
    const commitments = await askCommitments()
    if (!commitments) return false

    isSubmitting.value = true
    try {
      await send(commitments)
    } catch (err) {
      await handleFailure(err)
      return false
    } finally {
      isSubmitting.value = false
    }
    return true
  }

  async function accept(): Promise<void> {
    const before = renewal.value
    if (!before) return
    const wasAdmin: boolean = nths.hasAdminRole
    let outcome = undefined as NTHSAcceptanceOutcome | undefined
    const saved = await save(async (commitments) => {
      outcome = await nths.acceptNTHSRenewalPresidency({
        groupId: groupId(),
        commitments,
        reason: before.prompt === 'step-up' ? 'step-up' : undefined,
      })
    })
    if (!saved) return

    if (outcome === 'accepted') {
      void showToast(
        renewalAcceptedToast({
          prompt: before.prompt,
          closesOn: before.closesOn,
          gainedAdmin: !wasAdmin,
        })
      )
    }
    reloadNthsData()
  }

  return {
    renewal,
    chapterName,
    isSubmitting,
    errorMessage,
    accept,
  }
}
