import store from '@/store'

export function getGradeLevelTaskFromStorage(): string | null {
  return sessionStorage.getItem(getGradeLevelTaskKey())
}

export function setGradeLevelTaskInStorage(): void {
  sessionStorage.setItem(getGradeLevelTaskKey(), new Date().toString())
}

function getGradeLevelTaskKey(): string {
  return `GRADE_LEVEL_DASHBOARD_TASK-${store.state.user.user.id}`
}
