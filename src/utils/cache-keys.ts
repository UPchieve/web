import { IMPACT_STUDY_SURVEY_RESPONSES_CACHE_KEY } from '@/consts'

export function getUserCacheKey(key: string, userId?: string): string {
  if (userId) return `${key}_${userId}`
  return `${key}_anonymous`
}

export function getImpactStudyCacheKey(userId: string): string {
  return getUserCacheKey(IMPACT_STUDY_SURVEY_RESPONSES_CACHE_KEY, userId)
}
