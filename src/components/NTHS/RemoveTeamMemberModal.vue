<script lang="ts" setup>
import { useAppModalStore } from '@/stores/app/modal'
import type { GroupMember } from '@/services/NTHSGroupService'
import Loader from '@/components/Loader.vue'
import RemoveMemberConfirmation from '@/views/NTHS/RemoveMemberConfirmation.vue'

export type RemoveTeamMemberModalProps = {
  isLoading: boolean
  memberToRemove: GroupMember
  onRemoved: () => void
  onCancel: () => void
  isRemovingSelf: boolean
}

const props = defineProps<RemoveTeamMemberModalProps>()
const modalStore = useAppModalStore()

function onCancelRemoveMember() {
  props.onCancel()
  closeModal()
}
async function onRemovedMember() {
  props.onRemoved()
  closeModal()
}

function closeModal() {
  modalStore.hide()
}
</script>

<template>
  <div class="main-container">
    <Loader v-if="props.isLoading" />
    <RemoveMemberConfirmation
      v-else
      :memberToRemove="props.memberToRemove!"
      @removed="onRemovedMember"
      @cancel="onCancelRemoveMember"
      :isRemovingSelf="false"
    />
  </div>
</template>
