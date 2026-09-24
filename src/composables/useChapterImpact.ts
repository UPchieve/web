import { ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import type {
  NTHSChapterImpactPublic,
  NTHSChapterMonthPublic,
} from '@/services/NTHSGroupService'
import LoggerService from '@/services/LoggerService'
import {
  isPeriodStartRejection,
  rosterPeriodStarts,
} from '@/services/NTHSRosterService'

type NTHSChapterImpactAndMonth = NTHSChapterImpactPublic &
  NTHSChapterMonthPublic

export function useChapterImpact() {
  const impact = ref<NTHSChapterImpactAndMonth>()
  const isLoading = ref(true)
  const loadFailed = ref(false)

  // now drives the same monthStartsAt the roster sends, so Home's and
  // Members' top-tutor cards always agree.
  async function fetchImpact(groupId: string, now: Date) {
    try {
      return await NetworkService.getNTHSChapterImpact(
        groupId,
        rosterPeriodStarts(now).thisMonth
      )
    } catch (err) {
      if (!isPeriodStartRejection(err)) throw err
      return NetworkService.getNTHSChapterImpact(groupId)
    }
  }

  async function load(groupId: string, now: Date) {
    isLoading.value = true
    loadFailed.value = false
    try {
      const response = await fetchImpact(groupId, now)
      impact.value = response.data.impact
    } catch (err) {
      loadFailed.value = true
      LoggerService.noticeError(err, 'Could not load the NTHS chapter impact')
    } finally {
      isLoading.value = false
    }
  }

  // Overlapping refreshes can resolve out of order, so only the newest writes.
  let latestRefreshId = 0

  async function refresh(groupId: string, now: Date) {
    const refreshId = ++latestRefreshId
    try {
      const response = await fetchImpact(groupId, now)
      if (refreshId === latestRefreshId) impact.value = response.data.impact
    } catch (err) {
      LoggerService.noticeError(
        err,
        'Could not refresh the NTHS chapter impact'
      )
    }
  }

  return { impact, isLoading, loadFailed, load, refresh }
}
