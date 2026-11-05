import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import store from '@/store'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import axios from 'axios'
import { clearNTHSApplicationDraft } from '@/services/BrowserStorageService'
import { nthsDestination } from '@/views/NTHS/nths-route-helpers'
import type {
  AffiliationStatus,
  NTHSAcceptanceReason,
  NTHSRenewalCommitments,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'
import type {
  NTHSChecklistItemStatus,
  NTHSChecklistPublic,
  UpdateNTHSChecklistItemProgressResponse,
} from '@upchieve/api-contracts/nths-checklist'

export const useNthsStore = defineStore('nths', () => {
  const NTHSGroups = ref<any[]>([])
  const NTHSGroupMembers = ref<Record<string, any>>({})
  const NTHSChecklistData = ref<NTHSChecklistPublic | null>(null)
  const NTHSCandidateApplicationStatus = ref<any>(undefined)
  const approvalExpiresAt = ref<string | null>(null)
  const canApplyForNTHSPresident = ref(false)
  const NTHSApplicationIneligibilityReasons = ref<any[]>([])

  // Views like NTHSCreateGroupView set NTHS state without going through
  // fetchNthsData, so the attribute can lag by a page load. Gleap sends each
  // outbound message once, so the nudge still retires on time.
  function syncNTHSStatusToGleap() {
    const destination = nthsDestination(store)
    const userId = store.state.user?.user?.id
    if (!userId) return

    const groups = NTHSGroups.value ?? []
    const customData = {
      ...(destination ? { nthsStatus: destination } : {}),
      isNthsMember: groups.length > 0,
      isNthsAdmin: groups.some(
        (group) => group.memberInfo.roleName === 'admin'
      ),
      isNthsPresident: groups.some(
        (group) => group.memberInfo.title === 'President'
      ),
    }
    // every signed-in user runs this, not just coaches
    AnalyticsService.setContactCustomData(userId, customData)
  }

  function setNTHSGroups(groups: any[]) {
    NTHSGroups.value = groups
  }
  function setNTHSGroupMembers(data: { groupId: string; groupMembers: any }) {
    NTHSGroupMembers.value[data.groupId] = data.groupMembers
  }
  function setNTHSChecklist(checklist: NTHSChecklistPublic) {
    NTHSChecklistData.value = checklist
  }
  function setNTHSChecklistItemProgress({
    itemKey,
    status,
  }: UpdateNTHSChecklistItemProgressResponse) {
    const item = NTHSChecklistData.value?.sections
      .flatMap((section) => section.items)
      .find((item) => item.key === itemKey)
    if (item) {
      item.status = status
    }
  }
  function setNTHSGroupName({
    groupId,
    groupName,
  }: {
    groupId: string
    groupName: string
  }) {
    const group = NTHSGroups.value.find((g) => g.groupInfo.id === groupId)
    if (group) {
      const updatedGroupInfo = {
        ...group.groupInfo,
        name: groupName,
      }
      const updatedGroup = { ...group, groupInfo: { ...updatedGroupInfo } }
      NTHSGroups.value = [updatedGroup]
    }
  }
  function setNTHSGroupSchoolAffiliationStatus({
    groupId,
    schoolAffiliationStatus,
  }: {
    groupId: string
    schoolAffiliationStatus: AffiliationStatus
  }) {
    const group = NTHSGroups.value.find((g) => g.groupInfo.id === groupId)
    if (group) {
      group.schoolAffiliationStatus = schoolAffiliationStatus
    }
  }
  function setNTHSGroupRenewal({
    groupId,
    renewal,
  }: {
    groupId: string
    renewal: NTHSRenewalPublic
  }) {
    const group = NTHSGroups.value.find((g) => g.groupInfo.id === groupId)
    if (group) {
      group.renewal = renewal
    }
  }
  function setNTHSCandidateApplicationStatus(status: any) {
    NTHSCandidateApplicationStatus.value = status
  }
  function setApprovalExpiresAt(expiresAt: string | null) {
    approvalExpiresAt.value = expiresAt
  }
  function setCanApplyForNTHSPresident(isEligible: boolean) {
    canApplyForNTHSPresident.value = isEligible
  }
  function setNTHSApplicationIneligibilityReasons(reasons: any[]) {
    NTHSApplicationIneligibilityReasons.value = reasons
  }

  async function refreshNTHSGroups() {
    const results: any = await NetworkService.getNTHSGroupsForUser()
    setNTHSGroups(results.data.groups)
    setNTHSCandidateApplicationStatus(results.data.candidateApplicationStatus)
    setApprovalExpiresAt(results.data.approvalExpiresAt ?? null)
    if (results.data.candidateApplicationStatus) {
      clearNTHSApplicationDraft(store.state.user?.user?.id)
    }
    return results.data.groups
  }
  async function fetchNthsData() {
    const groups = await refreshNTHSGroups()

    const eligibility = await NetworkService.getNTHSApplicationEligibility()
    setCanApplyForNTHSPresident(eligibility.data.eligible)
    setNTHSApplicationIneligibilityReasons(eligibility.data.reasons ?? [])

    syncNTHSStatusToGleap()
    return groups
  }
  async function fetchNTHSGroupMembers(groupId: string) {
    const response: any = await NetworkService.getNTHSGroupMembers(groupId)
    const groupMembers = response.data?.members ?? []
    setNTHSGroupMembers({ groupId, groupMembers })
  }
  async function acceptNTHSRenewalPresidency({
    groupId,
    commitments,
    reason,
  }: {
    groupId: string
    commitments?: NTHSRenewalCommitments
    reason?: NTHSAcceptanceReason
  }) {
    const { renewal, outcome } =
      await NetworkService.acceptNTHSRenewalPresidency(groupId, {
        commitments,
        reason,
      })
    setNTHSGroupRenewal({ groupId, renewal })
    return outcome
  }
  async function fetchNTHSChecklist(groupId: string) {
    let checklist: NTHSChecklistPublic
    try {
      const response = await NetworkService.getNTHSChecklist(groupId)
      checklist = response.checklist
    } catch (error) {
      AnalyticsService.captureEvent(EVENTS.NTHS_CHECKLIST_LOAD_FAILED, {
        groupId,
        httpStatus: axios.isAxiosError(error)
          ? error.response?.status
          : undefined,
      })
      throw error
    }
    setNTHSChecklist(checklist)
    return checklist
  }
  async function updateNTHSChecklistItemProgress({
    groupId,
    itemKey,
    status,
  }: {
    groupId: string
    itemKey: string
    status: NTHSChecklistItemStatus
  }) {
    const checklist = NTHSChecklistData.value
    const section = checklist?.sections.find(({ items }) =>
      items.some(({ key }) => key === itemKey)
    )
    const item = section?.items.find(({ key }) => key === itemKey)
    const previousStatus = item?.status
    const eventProperties = {
      groupId,
      sectionId: section?.id,
      sectionTitle: section?.title,
      sectionOrder: section?.order,
      itemKey,
      itemTitle: item?.title,
      itemOrder: item?.order,
      previousStatus,
    }
    let progress: UpdateNTHSChecklistItemProgressResponse
    try {
      progress = await NetworkService.updateNTHSChecklistItemProgress(
        groupId,
        itemKey,
        { status }
      )
    } catch (error) {
      AnalyticsService.captureEvent(EVENTS.NTHS_CHECKLIST_ITEM_UPDATE_FAILED, {
        ...eventProperties,
        attemptedStatus: status,
      })
      throw error
    }
    setNTHSChecklistItemProgress(progress)
    AnalyticsService.captureEvent(EVENTS.NTHS_CHECKLIST_ITEM_UPDATED, {
      ...eventProperties,
      status: progress.status,
    })
    return progress
  }

  const memberRole = computed(() =>
    NTHSGroups.value.length ? NTHSGroups.value[0].memberInfo?.roleName : null
  )
  const hasAdminRole = computed(() => memberRole.value === 'admin')
  const isGroupMemberOnly = computed(
    () => !hasAdminRole.value && NTHSGroups.value.length > 0
  )
  const renewalPrompt = computed(() => NTHSGroups.value[0]?.renewal?.prompt)

  return {
    NTHSGroups,
    NTHSGroupMembers,
    NTHSChecklistData,
    NTHSCandidateApplicationStatus,
    approvalExpiresAt,
    canApplyForNTHSPresident,
    NTHSApplicationIneligibilityReasons,
    setNTHSGroups,
    setNTHSGroupMembers,
    setNTHSChecklist,
    setNTHSChecklistItemProgress,
    setNTHSGroupName,
    setNTHSGroupSchoolAffiliationStatus,
    setNTHSGroupRenewal,
    setNTHSCandidateApplicationStatus,
    setApprovalExpiresAt,
    setCanApplyForNTHSPresident,
    setNTHSApplicationIneligibilityReasons,
    refreshNTHSGroups,
    fetchNthsData,
    fetchNTHSGroupMembers,
    acceptNTHSRenewalPresidency,
    fetchNTHSChecklist,
    updateNTHSChecklistItemProgress,
    memberRole,
    hasAdminRole,
    isGroupMemberOnly,
    renewalPrompt,
  }
})
