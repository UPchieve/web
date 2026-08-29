<script lang="ts" setup>
import { computed, ref } from 'vue'
import ModalService from '@/services/ModalService'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import EditableName from '@/components/NTHS/EditableName.vue'
import Card from '@/components/NTHS/Card.vue'
import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'

const store = useStore()
const group = computed(() => store.state.nths.NTHSGroups?.[0])

const groupMembers = computed(() => {
  return store.state.nths.NTHSGroupMembers?.[group.value?.groupInfo?.id]
})
const currentGroupMember = computed(() =>
  groupMembers.value?.find(
    (member: any) => member.userId === store.state.user.user.id
  )
)
const isGroupAdmin = computed(
  () => group.value?.memberInfo?.roleName === 'admin'
)

const isFetchingGroupMembers = ref(false)
async function onLeaveTeam() {
  try {
    if (!groupMembers.value && group.value) {
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
  <div class="container">
    <div class="team">
      <Card v-if="isGroupAdmin">
        <template v-slot:header>Edit</template>
        <EditableName
          :groupName="group.groupInfo?.name"
          :groupId="group.groupInfo.id"
        />
      </Card>
      <LargeButton
        variant="danger"
        @click="onLeaveTeam"
        :showArrow="false"
        :disabled="isFetchingGroupMembers"
        data-testid="leave-team-button"
        >{{ isFetchingGroupMembers ? '...Loading' : 'Leave Team' }}</LargeButton
      >
    </div>
    <SchoolAffiliation
      v-if="isGroupAdmin && group.groupId"
      :groupId="group.groupId"
      :initialStatus="group.schoolAffiliationStatus"
      :hasSchoolOnRecord="!!group.hasSchoolOnRecord"
    />
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 24px;
  height: fit-content;
  overflow: visible;

  // Two columns only while the picker still fits its side-by-side panels;
  // below that it wraps under the team column.
  @include breakpoint-above('large') {
    flex-direction: row;
  }
}
.team {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 24px;
}
</style>
