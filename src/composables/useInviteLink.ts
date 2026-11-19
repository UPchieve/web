import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useClipboard } from '@vueuse/core'
import config from '@/config'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

export function useInviteLink(
  code: MaybeRefOrGetter<string>,
  referralCode: MaybeRefOrGetter<string>
) {
  const link = computed(() => {
    const query = new URLSearchParams({ referral: toValue(referralCode) })
    return `${config.appRoot}/join-team/${toValue(code)}?${query.toString()}`
  })
  const justCopied = ref(false)

  function copyLink() {
    justCopied.value = true

    // Created per call, so its async permission check has not resolved and it
    // copies synchronously through a hidden textarea.
    const { copy } = useClipboard()
    copy(link.value)
    AnalyticsService.captureEvent(EVENTS.VOLUNTEER_COPIED_TEAM_LINK, {
      inviteCode: toValue(code),
    })

    setTimeout(() => {
      justCopied.value = false
    }, 1000)
  }

  return { link, justCopied, copyLink }
}
