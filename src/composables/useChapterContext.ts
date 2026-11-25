import { computed } from 'vue'
import { useStore } from 'vuex'
import ModalService from '@/services/ModalService'
import type { GroupMember } from '@/services/NTHSGroupService'
import { useNthsStore } from '@/stores/nths'

export function useChapterContext() {
  const store = useStore()
  const nths = useNthsStore()
  const group = computed(() => nths.NTHSGroups?.[0])
  const groupId = computed(() => group.value?.groupInfo?.id)
  const currentUserId = computed(() => store.state.user.user.id)
  const referralCode = computed(() => store.state.user.user.referralCode)

  // The members list is refused to gated members, so the self member comes from the store.
  function leaveChapter() {
    if (!groupId.value) return
    ModalService.showLeaveTeamModal({
      isRemovingSelf: true,
      memberToRemove: {
        userId: currentUserId.value,
        nthsGroupId: groupId.value,
      } as GroupMember,
    })
  }

  return { group, groupId, currentUserId, referralCode, leaveChapter }
}
