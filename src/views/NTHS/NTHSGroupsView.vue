<script setup lang="ts">
import InviteLink from '@/components/NTHSGroup/InviteLink.vue'
import Spinner from '@/components/Spinner.vue'
import config from '@/config'
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import type { ManageTeamModalProps } from '@/views/NTHS/ManageTeamModal.vue'
import ModalService from '@/services/ModalService'

const store = useStore()
const group = computed(() => store.state.volunteer.NTHSGroups?.[0])
const groupMembers = computed(
  () => store.state.volunteer.NTHSGroupMembers?.[group.value?.groupId]
)
const code = computed(() => group.value?.inviteCode)
const isLoaded = ref(false)
const isGroupAdmin = computed(() => {
  return group.value?.roleName === 'admin'
})
const isFetchingGroupMembers = ref<boolean>(true)

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
})

const userManagementModalProps = computed(
  (): ManageTeamModalProps => ({
    members: groupMembers.value,
    isLoading: isFetchingGroupMembers.value,
  })
)
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="header-main-info">
        <h2 v-if="group?.groupName">{{ group.groupName }}</h2>
        <InviteLink v-if="code" :code="code" />
      </div>
      <LargeButton
        v-if="isGroupAdmin"
        @click="
          () =>
            ModalService.showNthsUserManagementModal(userManagementModalProps)
        "
        class="manage-team-button"
        variant="primary-blue"
        :showArrow="false"
        >Manage team</LargeButton
      >
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

  @include breakpoint-below('small') {
    flex-direction: column;
  }
}
.manage-team-button {
  margin-left: auto;
}
</style>
