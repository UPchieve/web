import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { toastController } from '@ionic/vue'
import LoggerService from '@/services/LoggerService'
import { secondsInMs } from '@/utils/time-utils'
import { isNetworkError } from '@/services/NetworkService'
import {
  isRenewalErrorCode,
  renewalAcceptedToast,
  renewalDeclinedToast,
  renewalErrorMessage,
} from '@/services/NTHSRenewalService'
import type {
  NTHSAcceptanceOutcome,
  NTHSRenewalCommitments,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

export type RenewalNamingResult = 'saved' | 'cancelled' | 'failed'

type Send = (commitments?: NTHSRenewalCommitments) => Promise<unknown>

type NamingRequest = {
  namesCaller: boolean
  send: Send
}

export function useRenewalNaming(
  groupId: () => string,
  // Resolves undefined when the caller backs out of the commitments.
  askCommitments: () => Promise<NTHSRenewalCommitments | undefined>
) {
  const store = useStore()
  const group = computed(() =>
    store.state.nths.NTHSGroups.find(
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
      color: 'dark',
      duration: secondsInMs(5),
      position: 'bottom',
    })
    await toast.present()
  }

  async function handleFailure(err: unknown) {
    errorMessage.value = renewalErrorMessage(err)
    if (!(isNetworkError(err) && err.clientMessage)) {
      LoggerService.noticeError(err, 'Could not save NTHS renewal')
    }
    try {
      await store.dispatch('nths/refreshNTHSGroups')
    } catch (refreshErr) {
      LoggerService.noticeError(refreshErr, 'Could not refresh NTHS groups')
    }
  }

  function reloadNthsData() {
    void store.dispatch('nths/fetchNthsData').catch((err) => {
      LoggerService.noticeError(err, 'Could not refresh NTHS data')
    })
  }

  // A commitments_required refusal asks for the commitments and retries.
  async function save(
    commitmentsNeeded: boolean,
    send: Send
  ): Promise<RenewalNamingResult> {
    errorMessage.value = ''
    let commitments: NTHSRenewalCommitments | undefined
    let asked = false
    if (commitmentsNeeded) {
      commitments = await askCommitments()
      if (!commitments) return 'cancelled'
      asked = true
    }

    isSubmitting.value = true
    try {
      try {
        await send(commitments)
      } catch (err) {
        if (asked || !isRenewalErrorCode(err, 'commitments_required')) {
          throw err
        }
        asked = true
        await store.dispatch('nths/refreshNTHSGroups')
        isSubmitting.value = false
        const answer = await askCommitments()
        if (!answer) return 'cancelled'
        isSubmitting.value = true
        await send(answer)
      }
    } catch (err) {
      await handleFailure(err)
      return 'failed'
    } finally {
      isSubmitting.value = false
    }
    return 'saved'
  }

  async function submit({
    namesCaller,
    send,
  }: NamingRequest): Promise<RenewalNamingResult> {
    const before = renewal.value
    if (!before) return 'cancelled'
    const result = await save(
      namesCaller && before.namingSelfAccepts && before.commitmentsRequired,
      send
    )
    if (result !== 'saved') return result

    const accepted = namesCaller && !!renewal.value?.namingSelfAccepts
    if (accepted) {
      void showToast(
        renewalAcceptedToast({
          chapterName: chapterName.value,
          closesOn: before.closesOn,
        })
      )
      reloadNthsData()
    }
    return 'saved'
  }

  function nameSelf(): Promise<RenewalNamingResult> {
    return submit({
      namesCaller: true,
      send: (commitments) =>
        store.dispatch('nths/nameSelfAsNTHSRenewalSuccessor', {
          groupId: groupId(),
          commitments,
        }),
    })
  }

  async function accept(): Promise<RenewalNamingResult> {
    const before = renewal.value
    if (!before) return 'cancelled'
    const wasAdmin: boolean = store.getters['nths/hasAdminRole']
    const stepUp = before.prompt === 'step-up'
    let outcome = undefined as NTHSAcceptanceOutcome | undefined
    const result = await save(
      stepUp || before.commitmentsRequired,
      async (commitments) => {
        outcome = await store.dispatch('nths/acceptNTHSRenewalPresidency', {
          groupId: groupId(),
          commitments,
          reason: stepUp ? 'step-up' : undefined,
        })
      }
    )
    if (result !== 'saved') return result

    if (outcome === 'accepted') {
      void showToast(
        renewalAcceptedToast({
          chapterName: chapterName.value,
          closesOn: before.closesOn,
          asCoPresident: before.prompt === 'co-president-offer',
          gainedAdmin: !wasAdmin,
          stepUp,
        })
      )
    }
    reloadNthsData()
    return 'saved'
  }

  async function decline(): Promise<RenewalNamingResult> {
    const before = renewal.value
    if (!before) return 'cancelled'
    const wasAdmin: boolean = store.getters['nths/hasAdminRole']
    const result = await save(false, () =>
      store.dispatch('nths/declineNTHSRenewalPresidency', groupId())
    )
    if (result !== 'saved') return result

    const toast = renewalDeclinedToast({ before, isAdmin: wasAdmin })
    if (toast) {
      void showToast(toast)
    }
    reloadNthsData()
    return 'saved'
  }

  return {
    renewal,
    chapterName,
    isSubmitting,
    errorMessage,
    submit,
    nameSelf,
    accept,
    decline,
  }
}
