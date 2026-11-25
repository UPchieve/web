import { computed, ref } from 'vue'
import { getNTHSChapterRoster } from '@/services/NetworkService'
import type {
  NTHSChapterRosterPublic,
  NTHSChapterRosterMemberPublic,
  NTHSSchoolYearPublic,
} from '@upchieve/api-contracts/nths-groups'
import LoggerService from '@/services/LoggerService'
import {
  isPeriodStartRejection,
  rosterPeriodStarts,
  type RosterRangeBounds,
} from '@/services/NTHSRosterService'

export function useChapterRoster() {
  const members = ref<NTHSChapterRosterMemberPublic[]>([])
  // A closed account is not a current member, though its row stays in the roster.
  const currentMembers = computed(() =>
    members.value.filter((member) => !member.accountClosed)
  )
  const schoolYear = ref<NTHSSchoolYearPublic>()
  const isLoading = ref(true)
  const loadFailed = ref(false)
  // A later load keeps the rows on screen, so a range change leaves the table
  // and its controls mounted.
  const isReloading = ref(false)
  let hasLoaded = false

  async function fetchRoster(
    groupId: string,
    now: Date,
    range?: RosterRangeBounds
  ) {
    try {
      return await getNTHSChapterRoster(
        groupId,
        range ? undefined : rosterPeriodStarts(now),
        range
      )
    } catch (err) {
      if (range || !isPeriodStartRejection(err)) {
        throw err
      }
      return getNTHSChapterRoster(groupId)
    }
  }

  function applyRoster(roster: NTHSChapterRosterPublic) {
    members.value = roster.members
    schoolYear.value = roster.schoolYear
  }

  // Two quick role changes start overlapping requests, and the older one can
  // resolve last with stale data, so only the newest writes.
  let latestRefreshId = 0

  async function load(groupId: string, now: Date, range?: RosterRangeBounds) {
    const refreshId = ++latestRefreshId
    isLoading.value = !hasLoaded
    isReloading.value = hasLoaded
    loadFailed.value = false
    try {
      const response = await fetchRoster(groupId, now, range)
      if (refreshId === latestRefreshId) {
        applyRoster(response.roster)
        hasLoaded = true
      }
    } catch (err) {
      if (refreshId === latestRefreshId) {
        loadFailed.value = true
      }
      LoggerService.noticeError(err, 'Could not load the NTHS chapter roster')
    } finally {
      if (refreshId === latestRefreshId) {
        isLoading.value = false
        isReloading.value = false
      }
    }
  }

  async function refresh(
    groupId: string,
    now: Date,
    range?: RosterRangeBounds
  ) {
    const refreshId = ++latestRefreshId
    try {
      const response = await fetchRoster(groupId, now, range)
      if (refreshId === latestRefreshId) {
        applyRoster(response.roster)
      }
    } catch (err) {
      LoggerService.noticeError(
        err,
        'Could not refresh the NTHS chapter roster'
      )
    } finally {
      // A refresh can supersede a pending load, whose own reset is then skipped.
      if (refreshId === latestRefreshId) {
        isLoading.value = false
        isReloading.value = false
      }
    }
  }

  // The view patches this list before its background refresh lands, so the
  // Status column and the chip counts move with the row that changed.
  function patchMember(
    userId: string,
    patch: Partial<NTHSChapterRosterMemberPublic>
  ) {
    members.value = members.value.map((member) =>
      member.userId === userId ? { ...member, ...patch } : member
    )
  }

  function dropMember(userId: string) {
    members.value = members.value.filter((member) => member.userId !== userId)
  }

  return {
    members,
    currentMembers,
    schoolYear,
    isLoading,
    isReloading,
    loadFailed,
    load,
    refresh,
    patchMember,
    dropMember,
  }
}
