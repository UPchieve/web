import { dayjs } from '@/utils/time-utils'
import { plural } from '@/utils/plural'
import { isNetworkError } from '@/services/NetworkService'
import type {
  NTHSRenewalPrompt,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

export function renewalDate(ymd: string | null): string {
  if (!ymd) return ''
  const date = dayjs(ymd, 'YYYY-MM-DD')
  return date.format('MMMM Do')
}

// The close date falls in the autumn of the school year being renewed for.
export function renewalStartYear(closesOn: string | null): string {
  return closesOn ? String(dayjs(closesOn, 'YYYY-MM-DD').year()) : ''
}

export function renewalSchoolYear(closesOn: string | null): string {
  if (!closesOn) return ''
  const startYear = Number(renewalStartYear(closesOn))
  return `${startYear}–\u2060${String((startYear + 1) % 100).padStart(2, '0')}`
}

function daysUntilCloseDate(closesOn: string | null): number {
  if (!closesOn) return 0
  return dayjs(closesOn, 'YYYY-MM-DD').diff(dayjs().startOf('day'), 'day')
}

// Vuex getters cache the clock, so read this from a component computed.
export function renewalDaysLeft(closesOn: string | null): number {
  return Math.max(daysUntilCloseDate(closesOn), 0)
}

function dayCount(days: number): string {
  return `${days} ${plural(days, 'day')}`
}

export function renewalAcceptedToast({
  prompt,
  closesOn,
  gainedAdmin,
}: {
  prompt: NTHSRenewalPrompt
  closesOn: string | null
  gainedAdmin: boolean
}): string {
  if (prompt === 'step-up') {
    return "You're now the chapter's president, with admin access."
  }
  const year = renewalSchoolYear(closesOn)
  if (prompt === 'confirm-return') {
    return `Your chapter is confirmed for ${year}. Thanks for leading!`
  }
  const title = `You're the chapter's president for ${year}!`
  return gainedAdmin ? `${title} You now have admin access.` : title
}

export function renewalErrorMessage(err: unknown): string {
  return isNetworkError(err) && err.clientMessage
    ? err.clientMessage
    : 'Something went wrong. Please refresh the page and try again.'
}

const CHAPTER_NEEDS_PRESIDENT_DOT_TITLE = 'Your chapter needs a president'

const RENEWAL_DOT_LABELS: Partial<Record<NTHSRenewalPrompt, string>> = {
  'confirm-return': 'Confirm your chapter is continuing',
  'president-not-cleared': 'Your chapter needs a returning president',
  'member-not-cleared': CHAPTER_NEEDS_PRESIDENT_DOT_TITLE,
  'member-countdown': CHAPTER_NEEDS_PRESIDENT_DOT_TITLE,
}

export function renewalDotLabel(
  prompt?: NTHSRenewalPrompt
): string | undefined {
  return prompt && RENEWAL_DOT_LABELS[prompt]
}

export function renewalCountdownTitle(daysLeft: number): string {
  return daysLeft === 0
    ? 'Last day to keep your chapter open'
    : `Your chapter closes in ${dayCount(daysLeft)}`
}

export function renewalWarningLine(
  renewal: NTHSRenewalPublic
): string | undefined {
  if (renewal.prompt !== 'member-not-cleared') return undefined
  const daysLeft = daysUntilCloseDate(renewal.closesOn)
  // The chapter closes at 12:00 UTC the day after closesOn, so the prompt
  // outlives the close date by up to a day in the viewer's zone.
  const closes =
    daysLeft < 0
      ? 'will close today'
      : daysLeft === 0
        ? 'will close after today'
        : `will close in ${dayCount(daysLeft)}`
  return `Your chapter needs a president for ${renewalSchoolYear(renewal.closesOn)} and ${closes} if no one steps up. Finish these steps to take it on.`
}
