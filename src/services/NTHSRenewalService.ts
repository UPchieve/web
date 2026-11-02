import { dayjs } from '@/utils/time-utils'
import { plural } from '@/utils/plural'
import { isNetworkError } from '@/services/NetworkService'
import { memberDisplayName } from '@/services/NTHSRosterService'
import type {
  NTHSRenewalPrompt,
  NTHSRenewalPublic,
  NTHSRenewalSuccessorPublic,
} from '@/services/NTHSGroupService'

const DAYJS_SEPTEMBER = 8

// "Aug 1", "Sept 15": dayjs abbreviates September as "Sep".
export function renewalDate(ymd: string | null): string {
  if (!ymd) return ''
  const date = dayjs(ymd, 'YYYY-MM-DD')
  return date.month() === DAYJS_SEPTEMBER
    ? `Sept ${date.date()}`
    : date.format('MMM D')
}

// The close date falls in the autumn of the school year being renewed for.
export function renewalSchoolYear(closesOn: string | null): string {
  if (!closesOn) return ''
  const startYear = dayjs(closesOn, 'YYYY-MM-DD').year()
  return `${startYear}–${String((startYear + 1) % 100).padStart(2, '0')}`
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

export function renewalCountdownLabel(daysLeft: number): string {
  return daysLeft === 0 ? 'Last day' : `${dayCount(daysLeft)} left`
}

export function isRenewalMustAnswer(prompt?: NTHSRenewalPrompt): boolean {
  return prompt === 'successor-must-answer' || prompt === 'member-must-answer'
}

export function renewalAcceptedToast({
  chapterName,
  closesOn,
  asCoPresident = false,
  gainedAdmin = false,
}: {
  chapterName: string
  closesOn: string | null
  asCoPresident?: boolean
  gainedAdmin?: boolean
}): string {
  const year = renewalSchoolYear(closesOn)
  const title = asCoPresident
    ? `You're a co-president of ${chapterName} for ${year}.`
    : `You're ${chapterName}'s president for ${year}.`
  return gainedAdmin ? `${title} You now have admin access.` : title
}

export function renewalDeclinedToast({
  before,
  isAdmin,
}: {
  before: NTHSRenewalPublic
  isAdmin: boolean
}): string | undefined {
  const steppedDown = "You've stepped down as next year's president."
  if (before.prompt === 'co-president-offer') return steppedDown
  if (before.prompt !== 'successor-must-answer') return undefined
  if (before.memberStageOpen) {
    return `${steppedDown} Every member is now being asked to step up.`
  }
  const namers = isAdmin ? 'You or another admin' : "Your chapter's admins"
  return `${steppedDown} ${namers} can name someone else until ${renewalDate(before.namingClosesOn)}.`
}

export function successorPickerHint(renewal: NTHSRenewalPublic): string {
  const namingClosesOn = renewalDate(renewal.namingClosesOn)
  return renewal.namingSelfAccepts
    ? `Name one or more members. They'll be notified and can accept right away. You can change who's named until ${namingClosesOn}, or until someone accepts.`
    : `Name one or more members. They'll be notified and can accept starting ${renewalDate(renewal.successorConfirmationOn)}. You can change who's named until ${namingClosesOn}.`
}

export function isRenewalErrorCode(err: unknown, code: string): boolean {
  return isNetworkError(err) && err.code === code
}

export function renewalErrorMessage(err: unknown): string {
  return isNetworkError(err) && err.clientMessage
    ? err.clientMessage
    : 'Something went wrong. Please refresh the page and try again.'
}

export const NEXT_PRESIDENT_UNNAMED_TITLE =
  "Next year's president hasn't been named yet"
export const NAMED_PRESIDENT_DOT_TITLE =
  "You've been named next year's president"
export const CHAPTER_NEEDS_PRESIDENT_DOT_TITLE =
  'Your chapter needs a president'

export function whoWillLeadTitle(chapterName: string): string {
  return `Who will lead ${chapterName} next year?`
}

export function namedSuccessors(
  successors: NTHSRenewalSuccessorPublic[]
): NTHSRenewalSuccessorPublic[] {
  return successors.filter(({ accepted }) => accepted === null)
}

export function successorNamerLabel(
  successor: NTHSRenewalSuccessorPublic,
  viewerId: string
): string | undefined {
  if (!successor.namedBy) return
  return successor.namedBy.userId === viewerId
    ? 'you'
    : memberDisplayName(successor.namedBy)
}

export function namedSuccessorsTitle(
  successors: NTHSRenewalSuccessorPublic[],
  viewerId: string
): string {
  const names = namedSuccessors(successors).map((successor) => {
    const name =
      successor.userId === viewerId ? 'you' : memberDisplayName(successor)
    const namer = successorNamerLabel(successor, viewerId)
    const viewerNamedSelf = name === 'you' && namer === 'you'
    return viewerNamedSelf || !namer ? name : `${name} (named by ${namer})`
  })
  return `Next year's president: ${joinNames(names)}`
}

function joinNames(names: string[]): string {
  return names.length > 2
    ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    : names.join(' and ')
}

export function acceptedPresidentsTitle(
  accepted: NTHSRenewalPublic['acceptedPresidents'],
  schoolYear: string
): string {
  return `${joinNames(accepted.map(memberDisplayName))} accepted the presidency for ${schoolYear}`
}

export function renewalCountdownTitle(
  chapterName: string,
  daysLeft: number
): string {
  return daysLeft === 0
    ? `Last day to keep ${chapterName} open`
    : `${chapterName} closes in ${dayCount(daysLeft)}`
}

export function renewalWarningLine(
  renewal: NTHSRenewalPublic,
  chapterName: string
): string | undefined {
  const year = renewalSchoolYear(renewal.closesOn)
  const daysLeft = daysUntilCloseDate(renewal.closesOn)
  // The chapter closes at 12:00 UTC the day after closesOn, so the prompt
  // outlives the close date by up to a day in the viewer's zone.
  const closes =
    daysLeft < 0
      ? 'closes today'
      : daysLeft === 0
        ? 'closes after today'
        : `closes in ${dayCount(daysLeft)}`
  if (renewal.prompt === 'successor-not-cleared') {
    if (!renewal.memberStageOpen) {
      return `You've been named ${chapterName}'s president for ${year}. Finish these steps to accept.`
    }
    return `${chapterName} needs a president. You've been named next year's president; it ${closes} if nobody accepts. Finish these steps to accept.`
  }
  if (renewal.prompt === 'member-not-cleared') {
    return `${chapterName} needs a president for ${year} and ${closes} if nobody steps up. Finish these steps to take it on.`
  }
  return undefined
}
