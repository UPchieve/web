import store from '@/store'

const HAS_SEEN_VOLUNTEER_HOURS = 'has-seen-volunteer-calculator'

function get(key: string, storage: Storage = localStorage) {
  const r = storage.getItem(key)
  return r ? JSON.parse(r) : undefined
}

function set(key: string, value: string[], storage: Storage = localStorage) {
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
