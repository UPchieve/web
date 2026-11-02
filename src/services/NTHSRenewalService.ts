import { dayjs } from '@/utils/time-utils'
import { isNetworkError } from '@/services/NetworkService'
import { memberDisplayName } from '@/services/NTHSRosterService'
import type {
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
  const list =
    names.length > 2
      ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      : names.join(' and ')
  return `Next year's president: ${list}`
}
