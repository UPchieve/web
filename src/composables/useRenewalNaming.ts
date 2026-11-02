import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { toastController } from '@ionic/vue'
import LoggerService from '@/services/LoggerService'
import { secondsInMs } from '@/utils/time-utils'
import { isNetworkError } from '@/services/NetworkService'
import {
  isRenewalErrorCode,
  renewalErrorMessage,
  renewalSchoolYear,
} from '@/services/NTHSRenewalService'
import type {
  NTHSRenewalCommitments,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

export type RenewalNamingResult = 'saved' | 'cancelled' | 'failed'

type NamingRequest = {
  namesCaller: boolean
  send: (commitments?: NTHSRenewalCommitments) => Promise<unknown>
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

  async function showAcceptedToast(schoolYear: string) {
    const toast = await toastController.create({
      message: `You're ${chapterName.value}'s president for ${schoolYear}.`,
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

  // A commitments_required refusal asks for the commitments and retries.
  async function submit({
    namesCaller,
    send,
  }: NamingRequest): Promise<RenewalNamingResult> {
    const before = renewal.value
    if (!before) return 'cancelled'
    errorMessage.value = ''
    let commitments: NTHSRenewalCommitments | undefined
    let asked = false
    if (namesCaller && before.namingSelfAccepts && before.commitmentsRequired) {
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

    const accepted = namesCaller && !!renewal.value?.namingSelfAccepts
    if (accepted) {
      void showAcceptedToast(renewalSchoolYear(before.closesOn))
      void store.dispatch('nths/fetchNthsData').catch((err) => {
        LoggerService.noticeError(err, 'Could not refresh NTHS data')
      })
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

  return {
    renewal,
    chapterName,
    isSubmitting,
    errorMessage,
    submit,
    nameSelf,
  }
}
