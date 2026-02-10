<script lang="ts" setup>
import { useStore } from 'vuex'
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
const store = useStore()

function onCancelRemoveMember() {
  props.onCancel()
  closeModal()
}
async function onRemovedMember() {
  props.onRemoved()
  closeModal()
}

function closeModal() {
  store.dispatch('app/modal/hide')
}
</script>

<template>
  <div class="main-container">
    <h1>Remove team member</h1>
    <Loader v-if="props.isLoading" />
    <RemoveMemberConfirmation
      v-else
      :memberToRemove="props.memberToRemove!"
      @removed="onCancelRemoveMember"
      @cancel="onRemovedMember"
      :isRemovingSelf="false"
    />
  </div>
</template>

<style lang="scss" scoped>
h1 {
  @include font-category('display-small');
  padding-bottom: 24px;
}
</style>
