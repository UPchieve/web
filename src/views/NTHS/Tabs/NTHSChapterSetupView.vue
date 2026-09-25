<script lang="ts" setup>
import { computed, ref } from 'vue'
import ModalService from '@/services/ModalService'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import EditableName from '@/components/NTHS/EditableName.vue'
import HQSection from '@/components/NTHS/HQ/HQSection.vue'
import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'
import type {
  AffiliationStatus,
  GroupMember,
} from '@/services/NTHSGroupService'

const store = useStore()
const group = computed(() => store.state.nths.NTHSGroups?.[0])

const groupMembers = computed(() => {
  return store.state.nths.NTHSGroupMembers?.[group.value?.groupInfo?.id]
})
const currentGroupMember = computed(() =>
  groupMembers.value?.find(
    (member: GroupMember) => member.userId === store.state.user.user.id
  )
)
const isGroupAdmin = computed(() => store.getters['nths/hasAdminRole'])

const SCHOOL_PATH_STATUSES: AffiliationStatus[] = [
  'PENDING_SCHOOL_AFFILIATION',
  'PENDING_UPCHIEVE_VERIFICATION',
  'AFFILIATED',
]
const nameHelp = computed(() =>
  SCHOOL_PATH_STATUSES.includes(group.value?.schoolAffiliationStatus)
    ? 'School chapters use "NTHS at [School]." Write out the school\'s full name.'
    : 'Community chapters pick their own name, then add "a chapter of NTHS" — like "Bay Area Tutors: a chapter of NTHS."'
)

const isFetchingGroupMembers = ref(false)
async function onLeaveTeam() {
  try {
    // An empty array is truthy, and the remove flow can leave one behind, which
    // would hand the modal an undefined member.
    if (!groupMembers.value?.length && group.value) {
      isFetchingGroupMembers.value = true
      await store.dispatch(
        'nths/fetchNTHSGroupMembers',
        group.value?.groupInfo?.id
      )
    }

    ModalService.showLeaveTeamModal({
      isRemovingSelf: true,
      memberToRemove: currentGroupMember.value,
    })
  } finally {
    isFetchingGroupMembers.value = false
  }
}
</script>

<template>
  <div class="setup">
    <div class="page-header">
      <h1 class="page-title">Chapter setup</h1>
      <p v-if="isGroupAdmin" class="page-subtitle" data-testid="setup-subtitle">
        Your chapter's name and how it's affiliated. You can change these later.
      </p>
    </div>

    <HQSection v-if="isGroupAdmin">
      <h2 class="question">Name your chapter</h2>
      <p class="help">{{ nameHelp }}</p>
      <EditableName
        class="name-editor"
        :groupName="group.groupInfo?.name"
        :groupId="group.groupInfo.id"
      />
    </HQSection>

    <SchoolAffiliation
      v-if="isGroupAdmin && group.groupId"
      :groupId="group.groupId"
      :initialStatus="group.schoolAffiliationStatus"
      :hasSchoolOnRecord="!!group.hasSchoolOnRecord"
    />

    <div class="leave">
      <LargeButton
        variant="danger"
        @click="onLeaveTeam"
        :showArrow="false"
        :disabled="isFetchingGroupMembers"
        data-testid="leave-team-button"
        v-ph:nthshq="'setup.leave_team'"
        >{{ isFetchingGroupMembers ? '...Loading' : 'Leave Team' }}</LargeButton
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setup {
  @include nths-tab-column(900px);
  align-items: stretch;
  overflow: visible;
}
.page-title {
  @include nths-page-title;
}
.page-subtitle {
  @include nths-page-subtitle;
}
.question {
  @include nths-card-title;
}
.help {
  @include nths-page-subtitle;
  margin-top: 4px;
}
.name-editor {
  margin-top: 14px;
}
.leave {
  display: flex;
  justify-content: flex-start;
}
</style>
