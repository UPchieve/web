import store from '@/store'
import type { ShareInfoFieldKey } from '@/consts'

const HAS_SEEN_VOLUNTEER_HOURS = 'has-seen-volunteer-calculator'
const SHARE_INFO_OPT_IN = 'volunteer-share-info-opt-in'

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

export function setShareInfoFields(
  userId: string,
  fields: ShareInfoFieldKey[]
): void {
  const answers = get(SHARE_INFO_OPT_IN) ?? {}
  set(SHARE_INFO_OPT_IN, { ...answers, [userId]: fields })
}

// Returns undefined if the volunteer hasn't answered yet.
export function getShareInfoFields(
  userId: string
): ShareInfoFieldKey[] | undefined {
  const answers = get(SHARE_INFO_OPT_IN) ?? {}
  return answers[userId]
}

export function hasAnsweredShareInfoOptIn(userId: string): boolean {
  const answers = get(SHARE_INFO_OPT_IN) ?? {}
  return Object.hasOwn(answers, userId)
}
