import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { refAutoReset, useClipboard } from '@vueuse/core'
import config from '@/config'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

export function useInviteLink(
  code: MaybeRefOrGetter<string>,
  referralCode: MaybeRefOrGetter<string>
) {
  const baseLink = computed(
    () => `${config.appRoot}/join-team/${toValue(code)}`
  )
  const link = computed(() => {
    const query = new URLSearchParams({ referral: toValue(referralCode) })
    return `${baseLink.value}?${query.toString()}`
  })
  const displayLink = computed(() => baseLink.value.replace(/^https?:\/\//, ''))
  const justCopied = refAutoReset(false, 1000)

  function copyLink() {
    justCopied.value = true

    // Created per call, so its async permission check has not resolved and it
    // copies synchronously through a hidden textarea.
    const focused = document.activeElement
    const { copy } = useClipboard()
    copy(link.value)
    // Selecting the textarea moves focus off the button, and removing it drops
    // focus to the body.
    if (focused instanceof HTMLElement && document.activeElement !== focused) {
      focused.focus()
    }
    AnalyticsService.captureEvent(EVENTS.VOLUNTEER_COPIED_TEAM_LINK, {
      inviteCode: toValue(code),
    })
  }

  return { displayLink, justCopied, copyLink }
}
