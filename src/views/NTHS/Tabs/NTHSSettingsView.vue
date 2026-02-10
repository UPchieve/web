<script lang="ts" setup>
import { computed } from 'vue'
import ModalService from '@/services/ModalService'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import EditableName from '@/components/NTHS/EditableName.vue'
import Card from '@/components/NTHS/Card.vue'

const store = useStore()
const group = computed(() => store.state.volunteer.NTHSGroups?.[0])
const groupMembers = computed(
  () => store.state.volunteer.NTHSGroupMembers?.[group.value?.groupId]
)
const currentGroupMember = computed(() =>
  groupMembers.value?.find(
    (member: any) => member.userId === store.state.user.user.id
  )
)
const isGroupAdmin = computed(() => group.value?.roleName === 'admin')
function onLeaveTeam() {
  ModalService.showLeaveTeamModal({
    isRemovingSelf: true,
    memberToRemove: currentGroupMember.value,
  })
}
</script>

<template>
  <div class="container">
    <section class="section">
      <Card v-if="isGroupAdmin">
        <template v-slot:header>Edit</template>
        <EditableName :groupName="group.groupName" :groupId="group.groupId" />
      </Card>
    </section>
    <LargeButton
      variant="danger"
      @click="onLeaveTeam"
      :showArrow="false"
      class="team-action-button"
      >Leave team</LargeButton
    >
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  gap: 24px;
  flex-direction: row;
  justify-content: space-between;
  align-items: start;
  flex-wrap: wrap;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
