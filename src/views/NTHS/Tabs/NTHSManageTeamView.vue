<script setup lang="ts">
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import LargeButton from '@/components/LargeButton.vue'
import MemberRoleDropdown from '@/components/NTHS/MemberRoleDropdown.vue'
import type { GroupMember } from '@/services/NTHSGroupService'
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import Loader from '@/components/Loader.vue'
import ModalService from '@/services/ModalService'

const store = useStore()
const group = computed(() => store.state.nths.NTHSGroups?.[0])
const isFetchingGroupMembers = ref<boolean>(true)
const groupMembers = computed(
  () => store.state.nths.NTHSGroupMembers?.[group.value?.groupInfo?.id]
)

const groupId = computed(() => group.value?.groupInfo?.id)
const isLoading = computed(() => isFetchingGroupMembers.value)

onBeforeMount(async () => {
  isFetchingGroupMembers.value = true
  if (!groupMembers.value && group.value) {
    await store.dispatch(
      'nths/fetchNTHSGroupMembers',
      group.value?.groupInfo?.id
    )
  }
  isFetchingGroupMembers.value = false
})

const membersExcludingCurrentUser = computed(() =>
  store.state.nths.NTHSGroupMembers[groupId.value].filter(
    (member: any) => !isCurrentUser(member.userId)
  )
)

function isCurrentUser(userId: string): boolean {
  return userId === store.state.user.user.id
}
function getAvatarBackgroundColorByIndex(index: number): string {
  // Alternate colors from this set
  const COLORS = ['#16d2aa', '#1855d1', '#ff8c5f']
  return COLORS[index % COLORS.length]
}

const errorMessage = ref<string>('')
function onUpdateError(user: string) {
  errorMessage.value = `Something went wrong while updating settings for user ${user}. Please refresh the page and try again.`
}

const memberToRemove = ref<GroupMember | null>(null)

async function showRemoveTeamMemberConfirmation(member: GroupMember) {
  memberToRemove.value = member
  ModalService.showNthsUserManagementModal({
    isLoading: isLoading.value,
    memberToRemove: memberToRemove.value,
    onRemoved: onRemovedMember,
    onCancel: onCancelRemoveMember,
    isRemovingSelf: false,
  })
}
function onCancelRemoveMember() {
  memberToRemove.value = null
}
async function onRemovedMember() {
  memberToRemove.value = null
}

const removeText = computed(() => {
  if (store.getters['app/isMobilePortrait']) {
    return 'X'
  }
  return 'Remove from team'
})
</script>
<template>
  <div class="container">
    <div v-if="errorMessage" class="error-container">
      {{ errorMessage }}
    </div>
    <Loader v-if="isLoading" />
    <div class="member-grid" v-else>
      <div class="table-heading name">Name</div>
      <div class="table-heading status">Status</div>
      <div class="table-heading remove"></div>
      <div
        v-for="(member, index) in membersExcludingCurrentUser"
        :key="member.userId"
        class="member-row"
      >
        <div
          class="name member-cell"
          :class="{
            'bottom-border': index !== membersExcludingCurrentUser.length - 1,
          }"
        >
          <InitialsAvatar
            :initials="`${member.firstName.charAt(0)}`.toUpperCase()"
            :widthPx="40"
            :bgColor="getAvatarBackgroundColorByIndex(index)"
          />
          {{ member.firstName }}
        </div>
        <MemberRoleDropdown
          :groupMember="member"
          class="status member-cell"
          :class="{
            'bottom-border': index !== membersExcludingCurrentUser.length - 1,
          }"
          @error="() => onUpdateError(member.firstName)"
          @success="errorMessage = ''"
        />
        <div
          class="member-cell"
          :class="{
            'bottom-border': index !== membersExcludingCurrentUser.length - 1,
          }"
        >
          <LargeButton
            class="member-cell remove remove-button"
            @click="() => showRemoveTeamMemberConfirmation(member)"
            variant="danger-secondary"
            :showArrow="false"
            >{{ removeText }}</LargeButton
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  padding: 0 20px;
}
h1 {
  @include font-category('display-small');
  padding-bottom: 24px;
}

.member-grid {
  display: grid;
  grid-template-columns: [name] 1fr [status] 1fr [remove];
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  width: 100%;
  background-color: white;

  @include breakpoint-below('small') {
    grid-template-columns: [name] minmax(0, 0.5fr) [status] 1fr [remove] minmax(
        0,
        0.5fr
      );
  }

  .table-heading {
    @include font-category('subheading');
    display: flex;
    padding: 16px;
    border-bottom: 1px solid $c-border-grey;
  }

  .member-row {
    display: contents;

    .bottom-border {
      border-bottom: 1px solid $c-border-grey;
      width: 100%;
    }

    .member-cell {
      height: 100%;
      width: 100%;
      padding: 16px;
      align-content: center;
      text-align: start;
      word-wrap: break-word;

      @include breakpoint-below('small') {
        padding: 8px;
      }
    }
  }

  .name {
    grid-column: name;
  }

  .status {
    grid-column: status;
  }

  .remove {
    grid-column: remove;
  }
}

.remove-button {
  border: 1px solid $c-error-red;
  border-radius: 200px;
  color: $c-error-red;
  max-height: 40px;
}

.error-container {
  border: 1px solid $c-error-red;
  border-radius: 8px;
  background-color: lighten($c-error-red, 30%);
  padding: 16px;
  margin-bottom: 32px;
}

.buttons-container {
  display: flex;
  flex-direction: row-reverse;
  padding-top: 16px;
}
</style>
