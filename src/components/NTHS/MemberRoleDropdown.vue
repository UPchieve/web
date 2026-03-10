<script lang="ts" setup>
import { computed, ref } from 'vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import { startCase } from 'lodash-es'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { useStore } from 'vuex'
import type { GroupMember, Role } from '@/services/NTHSGroupService'

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
}>()

function toDisplayRole(role: Role): DisplayRole {
  return startCase(role) as DisplayRole
}

const isLoading = ref<boolean>(false)
const selectedRole = ref<DisplayRole>(toDisplayRole(props.groupMember.roleName))
const placeholder = computed(() =>
  isLoading.value ? 'Updating...' : toDisplayRole(props.groupMember.roleName)
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
    await NetworkService.updateNTHSGroupMember(
      props.groupMember.nthsGroupId,
      props.groupMember.userId,
      { role }
    )
    selectedRole.value = newRole
    const updatedMembers: GroupMember[] = [
      ...store.state.nths.NTHSGroupMembers[props.groupMember.nthsGroupId],
    ]
    const indexOfUpdated = updatedMembers.findIndex(
      (member) => member.userId === props.groupMember.userId
    )
    updatedMembers[indexOfUpdated].roleName = role
    store.commit('nths/setNTHSGroupMembers', {
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
    :placeholder="placeholder"
    :modelValue="isLoading ? placeholder : selectedRole"
    @update:modelValue="onChangeRole"
    :disabled="isLoading"
  />
</template>

<style lang="scss" scoped>
.dropdown {
  margin-top: 0;
}
</style>
