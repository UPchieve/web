import { ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import type {
  NTHSChapterRosterPublic,
  NTHSRosterMemberPublic,
  NTHSSchoolYearPublic,
  NTHSTopTutorPublic,
} from '@/services/NTHSGroupService'
import LoggerService from '@/services/LoggerService'
import {
  isPeriodStartRejection,
  rosterPeriodStarts,
} from '@/services/NTHSRosterService'

export function useChapterRoster() {
  const members = ref<NTHSRosterMemberPublic[]>([])
  const schoolYear = ref<NTHSSchoolYearPublic>()
  const topTutorThisMonth = ref<NTHSTopTutorPublic>()
  const isLoading = ref(true)
  const loadFailed = ref(false)

  async function fetchRoster(groupId: string, now: Date) {
    try {
      return await NetworkService.getNTHSChapterRoster(
        groupId,
        rosterPeriodStarts(now)
      )
    } catch (err) {
      if (!isPeriodStartRejection(err)) throw err
      return NetworkService.getNTHSChapterRoster(groupId)
    }
  }

  function applyRoster(roster: NTHSChapterRosterPublic) {
    members.value = roster.members
    schoolYear.value = roster.schoolYear
    topTutorThisMonth.value = roster.topTutorThisMonth
  }

  async function load(groupId: string, now: Date) {
    isLoading.value = true
    loadFailed.value = false
    try {
      const response = await fetchRoster(groupId, now)
      applyRoster(response.data.roster)
    } catch (err) {
      loadFailed.value = true
      LoggerService.noticeError(err, 'Could not load the NTHS chapter roster')
    } finally {
      isLoading.value = false
    }
  }

  // Two quick role changes start overlapping refreshes, and the older one can
  // resolve last with stale roles, so only the newest writes.
  let latestRefreshId = 0

  async function refresh(groupId: string, now: Date) {
    const refreshId = ++latestRefreshId
    try {
      const response = await fetchRoster(groupId, now)
      if (refreshId === latestRefreshId) applyRoster(response.data.roster)
    } catch (err) {
      LoggerService.noticeError(
        err,
        'Could not refresh the NTHS chapter roster'
      )
    }
  }

  // The view patches this list before its background refresh lands, so the
  // Status column and the chip counts move with the row that changed.
  function patchMember(userId: string, patch: Partial<NTHSRosterMemberPublic>) {
    members.value = members.value.map((member) =>
      member.userId === userId ? { ...member, ...patch } : member
    )
  }

  function dropMember(userId: string) {
    members.value = members.value.filter((member) => member.userId !== userId)
  }

  return {
    members,
    schoolYear,
    topTutorThisMonth,
    isLoading,
    loadFailed,
    load,
    refresh,
    patchMember,
    dropMember,
  }
}
