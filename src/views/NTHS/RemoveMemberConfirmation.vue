<script lang="ts" setup>
import type { GroupMember } from '@/services/NTHSGroupService'
import LargeButton from '@/components/LargeButton.vue'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

export type RemoveMemberConfirmationProps = {
  memberToRemove: GroupMember
  isRemovingSelf: boolean
}

const store = useStore()
const router = useRouter()
const props = defineProps<RemoveMemberConfirmationProps>()
const emit = defineEmits<{
  (e: 'removed'): void
  (e: 'cancel'): void
}>()
const errorMessage = ref<string>('')

const userToRemoveName = computed(() =>
  props.isRemovingSelf
    ? 'yourself'
    : `${props.memberToRemove.firstName} ${props.memberToRemove.lastInitial}.`
)

async function removeTeamMember() {
  errorMessage.value = ''
  try {
    const groupId = props.memberToRemove.nthsGroupId
    if (props.isRemovingSelf) {
      await NetworkService.leaveNthsChapter(props.memberToRemove.nthsGroupId)
      store.commit('nths/setNTHSGroupMembers', {
        groupId,
        groupMembers: [],
      })
      await store.dispatch('nths/fetchNTHSGroupsForUser')
      await router.push('/dashboard')
    } else {
      await NetworkService.updateNTHSGroupMember(
        groupId,
        props.memberToRemove.userId,
        {
          isActive: false,
        }
      )
      const updatedGroupMembers = store.state.nths.NTHSGroupMembers[
        groupId
      ].filter((member: any) => member.userId !== props.memberToRemove.userId)
      store.commit('nths/setNTHSGroupMembers', {
        groupId,
        groupMembers: updatedGroupMembers,
      })
    }
    emit('removed')
  } catch (err) {
    LoggerService.noticeError(
      err,
      `Failed to deactivate member ${props.memberToRemove.userId} from group ${props.memberToRemove.nthsGroupId}`
    )
    errorMessage.value =
      err?.message ??
      `Something went wrong while removing ${props.memberToRemove.firstName} ${props.memberToRemove.lastInitial}. from the team. Please refresh the page and try again.`
  }
}

function onCancel() {
  emit('cancel')
  if (props.isRemovingSelf) {
    store.dispatch('app/modal/hide')
  }
}
</script>

<template>
  <div class="main-container">
    <div v-if="errorMessage" class="error-container">
      {{ errorMessage }}
    </div>
    <div class="text-content">
      Are you sure you want to remove
      <strong v-if="!isRemovingSelf">{{ userToRemoveName }}</strong>
      <span v-else>{{ userToRemoveName }}</span>
      from your team?<br />
      <span v-if="!isRemovingSelf"
        >You will no longer be able to track their status, and their future
        tutoring contributions will no longer count toward your team.<br /><br
      /></span>
      <strong
        ><span class="warning-text">This action cannot be undone!</span></strong
      >
    </div>

    <LargeButton
      :showArrow="false"
      variant="danger"
      @click="removeTeamMember"
      class="main-button"
    >
      Remove {{ userToRemoveName }} from team</LargeButton
    >
    <LargeButton
      :showArrow="false"
      variant="secondary"
      @click="onCancel"
      class="main-button"
      >Cancel</LargeButton
    >
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.error-container {
  border: 1px solid $c-error-red;
  border-radius: 8px;
  background-color: lighten($c-error-red, 30%);
  padding: 16px;
  margin-bottom: 32px;
}

.text-content {
  padding-bottom: 16px;
}
.warning-text {
  color: $c-error-red;
}
.main-button {
  width: 80%;
}
</style>
