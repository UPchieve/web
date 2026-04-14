import { dayjs } from '@/utils/time-utils'

const MONTHS_THRESHOLD = 12

function getPermanentlyDismissedKey(userId: string) {
  return `${userId}-permanently-dismissed-secondary-email-modal-2`
}

function getTemporarilyDismissedKey(userId: string) {
  return `${userId}-temporarily-dismissed-secondary-email-modal`
}

function getPermanentlyDismissedValue(userId: string): Date | null {
  const val = localStorage.getItem(getPermanentlyDismissedKey(userId))
  try {
    return new Date(val!)
  } catch {
    return null
  }
}

export function hasPermanentlyDismissedSecondaryEmailModal(
  userId: string
): boolean {
  const lastPermanentlyDismissedAt = getPermanentlyDismissedValue(userId)
  if (!lastPermanentlyDismissedAt) return false
  const elapsedMonths = dayjs().diff(
    dayjs(lastPermanentlyDismissedAt),
    'months'
  )

  return elapsedMonths < MONTHS_THRESHOLD
}

export function hasTemporarilyDismissedSecondaryEmailModal(
  userId: string
): boolean {
  return sessionStorage.getItem(getTemporarilyDismissedKey(userId)) !== null
}

export function setPermanentlyDismissSecondaryEmailModal(
  userId: string,
  date: Date
): void {
  localStorage.setItem(getPermanentlyDismissedKey(userId), date.toString())
}

export function setTemporarilyDismissSecondaryEmailModal(userId: string): void {
  sessionStorage.setItem(getTemporarilyDismissedKey(userId), 'true')
}

export function isTargetEmailDomain(email: string): boolean {
  const r: RegExp = /(.*@.*.edu)|(.*@.*isd.*)|(.*@.*k12.*)/g
  return r.test(email)
}
