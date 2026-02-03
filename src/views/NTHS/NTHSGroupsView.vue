<script setup lang="ts">
import InviteLink from '@/components/NTHS/InviteLink.vue'
import Spinner from '@/components/Spinner.vue'
import config from '@/config'
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import type { ManageTeamModalProps } from '@/components/NTHS/ManageTeamModal.vue'
import ModalService from '@/services/ModalService'
import EditableName from '@/components/NTHS/EditableName.vue'
import Checklist from '@/components/NTHS/Checklist.vue'

const store = useStore()
const group = computed(() => store.state.volunteer.NTHSGroups?.[0])
const groupMembers = computed(
  () => store.state.volunteer.NTHSGroupMembers?.[group.value?.groupId]
)
const code = computed(() => group.value?.inviteCode)
const isLoaded = ref(false)
const isGroupAdmin = computed(() => group.value?.roleName === 'admin')
const isFetchingGroupMembers = ref<boolean>(true)
const groupActions = computed(() => store.state.volunteer.NTHSGroupActions)
const actions = computed(() => store.state.volunteer.NTHSActions ?? [])
const checklist = computed(() => store.getters['volunteer/NTHSChecklist'])

onBeforeMount(async () => {
  if (!group.value) {
    // This is fetched in SidebarLinks, but if you refresh the page starting here, there's no guarantee that component
    // gets rendered before this one.
    await store.dispatch('volunteer/fetchNTHSGroupsForUser')
  }
  if (!groupMembers.value && group.value) {
    await store.dispatch('volunteer/fetchNTHSGroupMembers', group.value.groupId)
  }
  isFetchingGroupMembers.value = false

  await store.dispatch('volunteer/fetchNTHSGroupActions', group.value.groupId)
})

const userManagementModalProps = computed(
  (): ManageTeamModalProps => ({
    groupId: group.value?.groupId,
    isLoading: isFetchingGroupMembers.value,
  })
)

const currentGroupMember = computed(() =>
  groupMembers.value?.find(
    (member: any) => member.userId === store.state.user.user.id
  )
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
    <div class="header">
      <div class="header-main-info">
        <EditableName
          :groupName="group.groupName"
          :groupId="group.groupId"
          :isGroupAdmin="isGroupAdmin"
        />
        <InviteLink v-if="code" :code="code" />
      </div>
      <LargeButton
        v-if="isGroupAdmin"
        @click="
          () =>
            ModalService.showNthsUserManagementModal(userManagementModalProps)
        "
        class="team-action-button"
        variant="primary-blue"
        :showArrow="false"
        >Manage team</LargeButton
      >
      <LargeButton
        variant="danger"
        @click="onLeaveTeam"
        :showArrow="false"
        class="team-action-button"
        >Leave team</LargeButton
      >
    </div>

    <div class="check-list-container" v-if="isGroupAdmin && checklist.length">
      <Checklist
        :groupId="group.groupId"
        :actions="actions"
        :groupActions="groupActions"
        :checklist="checklist"
      />
    </div>
    <div class="container">
      <iframe
        v-if="Boolean(group?.groupId)"
        ref="iframe"
        class="iframe"
        :class="isLoaded ? '' : 'hide'"
        :src="`${config.NTHSRetoolDashboardUrl}?groupId=${group.groupId}`"
        width="100%"
        height="100%"
        loading="lazy"
        :onload="() => (isLoaded = true)"
      />
      <div class="spinner-container" v-if="!isLoaded">
        <Spinner />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.spinner-container {
  flex-grow: 1;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
}
.hide {
  width: 0;
  height: 0;
  opacity: 0;
}
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  gap: 12px;
}
.check-list-container {
  padding: 0 20px;
  display: grid;
  gap: 8px;
}
.iframe {
  border: none;
}
.header {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 1em 1em 0 1em;
  gap: 8px;
  @include breakpoint-below('large') {
    flex-direction: column;
  }
}
.header-main-info {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;

  @include breakpoint-below('small') {
    flex-direction: column;
  }
}
.team-action-button {
  margin-left: auto;
}
</style>
