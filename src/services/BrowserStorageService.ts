import store from '@/store'
import { getUserCacheKey } from '@/utils/cache-keys'
import type { NTHSApplicationDraft } from '@/services/NTHSApplicationService'

const HAS_SEEN_VOLUNTEER_HOURS = 'has-seen-volunteer-calculator'
const HAS_SEEN_SHOW_ONLINE_STATUS_MODAL = 'has-seen-show-online-status-modal'
const NTHS_APPLICATION_DRAFT = 'nths-application-draft'

function get(key: string, storage: Storage = localStorage) {
  const r = storage.getItem(key)
  return r ? JSON.parse(r) : undefined
}

function set(key: string, value: unknown, storage: Storage = localStorage) {
  storage.setItem(key, JSON.stringify(value))
}

export function getGradeLevelTaskFromStorage(): string | null {
  return sessionStorage.getItem(getGradeLevelTaskKey())
}

export function setGradeLevelTaskInStorage(): void {
  sessionStorage.setItem(getGradeLevelTaskKey(), new Date().toString())
}

function getGradeLevelTaskKey(): string {
  return `GRADE_LEVEL_DASHBOARD_TASK-${store.state.user.user.id}`
}

export function setHasSeenVolunteerHours(userId: string) {
  const ids = get(HAS_SEEN_VOLUNTEER_HOURS) ?? []
  set(HAS_SEEN_VOLUNTEER_HOURS, [...ids, userId])
}

export function hasSeenVolunteerHours(userId: string) {
  return (get(HAS_SEEN_VOLUNTEER_HOURS) ?? '[]').includes(userId)
}

export function setHasSeenShowOnlineStatusModal(userId: string) {
  const ids = get(HAS_SEEN_SHOW_ONLINE_STATUS_MODAL) ?? []
  set(HAS_SEEN_SHOW_ONLINE_STATUS_MODAL, [...ids, userId])
}

export function hasSeenShowOnlineStatusModal(userId: string): boolean {
  return (get(HAS_SEEN_SHOW_ONLINE_STATUS_MODAL) ?? []).includes(userId)
}

// Private browsing, a full quota, or storage blocked by the browser all make
// localStorage throw, and none of that may stop the coach from applying.
export function getNTHSApplicationDraft(userId: string | undefined): unknown {
  if (!userId) return undefined
  try {
    return get(getUserCacheKey(NTHS_APPLICATION_DRAFT, userId))
  } catch {
    return undefined
  }
}

export function setNTHSApplicationDraft(
  userId: string | undefined,
  draft: NTHSApplicationDraft
): void {
  if (!userId) return
  try {
    set(getUserCacheKey(NTHS_APPLICATION_DRAFT, userId), draft)
  } catch {
    // best effort, as in getNTHSApplicationDraft
  }
}

export function clearNTHSApplicationDraft(userId: string | undefined): void {
  if (!userId) return
  try {
    localStorage.removeItem(getUserCacheKey(NTHS_APPLICATION_DRAFT, userId))
  } catch {
    // best effort, as in getNTHSApplicationDraft
  }
}
