<script lang="ts" setup>
import { computed, ref } from 'vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import { startCase } from 'lodash-es'
import type { Role } from '@/views/NTHS/NTHSGroupsView.vue'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { useStore } from 'vuex'
import type { GroupMember } from '@/types/nths-types'

type DisplayRole = 'Admin' | 'Member'
const store = useStore()
const roleOptions: DisplayRole[] = ['Admin', 'Member']
const props = defineProps<{
  groupMember: {
    firstName: string
    userId: string
    nthsGroupId: string
    roleName: Role
  }
  disabled: boolean
}>()

const isLoading = ref<boolean>(false)
const selectedRole = ref<DisplayRole>(startCase(props.groupMember.roleName))
const placeholder = computed(() =>
  isLoading.value ? 'Updating...' : startCase(props.groupMember.roleName)
)
const emit = defineEmits<{
  (e: 'error', error: any): void
  (e: 'success'): void
}>()

async function onChangeRole(newRole: DisplayRole) {
  const role = newRole.toLowerCase() as Role
  if (props.groupMember.roleName === role) return

  try {
    isLoading.value = true
    await NetworkService.updateNTHSGroupMemberRole(
      props.groupMember.nthsGroupId,
      props.groupMember.userId,
      role
    )
    selectedRole.value = newRole
    const updatedMembers: GroupMember[] = [
      ...store.state.volunteer.NTHSGroupMembers[props.groupMember.nthsGroupId],
    ]
    const indexOfUpdated = updatedMembers.findIndex(
      (member) => member.userId === props.groupMember.userId
    )
    updatedMembers[indexOfUpdated].roleName = role
    store.commit('volunteer/setNTHSGroupMembers', {
      groupId: props.groupMember.nthsGroupId,
      groupMembers: updatedMembers,
    })
    emit('success')
  } catch (err) {
    LoggerService.noticeError(err)
    emit('error', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <FormSelect
    class="dropdown"
    name="Role"
    :options="roleOptions"
    :disabled="props.disabled"
    :placeholder="placeholder"
    :modelValue="selectedRole"
    @update:modelValue="onChangeRole"
  />
</template>

<style lang="scss" scoped>
.dropdown {
  margin-top: 0;
}
</style>
