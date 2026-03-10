<script lang="ts" setup>
import { computed } from 'vue'
import ModalService from '@/services/ModalService'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import EditableName from '@/components/NTHS/EditableName.vue'
import Card from '@/components/NTHS/Card.vue'
import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'

const store = useStore()
const group = computed(() => store.state.nths.NTHSGroups?.[0])

const groupMembers = computed(
  () => store.state.nths.NTHSGroupMembers?.[group.value?.groupInfo?.id]
)
const currentGroupMember = computed(() =>
  groupMembers.value?.find(
    (member: any) => member.userId === store.state.user.user.id
  )
)
const isGroupAdmin = computed(
  () => group.value?.memberInfo?.roleName === 'admin'
)
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
      <Card v-if="isGroupAdmin" class="fit">
        <template v-slot:header>Edit</template>
        <EditableName
          :groupName="group.groupInfo?.name"
          :groupId="group.groupInfo.id"
        />
      </Card>
      <SchoolAffiliation
        v-if="isGroupAdmin && group.groupId"
        :groupId="group.groupId"
        :initialStatus="group.schoolAffiliationStatus"
      />
    </section>
    <LargeButton
      variant="danger"
      @click="onLeaveTeam"
      :showArrow="false"
      class="shrink"
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
  height: fit-content;
  overflow: visible;
}
.section {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  flex: 1;
}
.shrink {
  flex-shrink: 1;
  flex-grow: 0;
}

.fit {
  width: fit-content;
  height: fit-content;
}
</style>
