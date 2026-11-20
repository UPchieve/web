import { ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import type { NTHSChapterImpactPublic } from '@/services/NTHSGroupService'
import LoggerService from '@/services/LoggerService'

export function useChapterImpact() {
  const impact = ref<NTHSChapterImpactPublic>()
  const isLoading = ref(true)
  const loadFailed = ref(false)

  async function load(groupId: string) {
    isLoading.value = true
    loadFailed.value = false
    try {
      const response = await NetworkService.getNTHSChapterImpact(groupId)
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

  async function refresh(groupId: string) {
    const refreshId = ++latestRefreshId
    try {
      const response = await NetworkService.getNTHSChapterImpact(groupId)
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
