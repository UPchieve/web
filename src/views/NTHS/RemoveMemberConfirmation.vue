<script lang="ts" setup>
import { useAppModalStore } from '@/stores/app/modal'
import type { GroupMember } from '@/services/NTHSGroupService'
import LargeButton from '@/components/LargeButton.vue'
import NetworkService, { isNetworkError } from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { useStore } from 'vuex'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export type RemoveMemberConfirmationProps = {
  memberToRemove: GroupMember
  isRemovingSelf: boolean
}

const store = useStore()

const modalStore = useAppModalStore()
const router = useRouter()
const props = defineProps<RemoveMemberConfirmationProps>()
const emit = defineEmits<{
  (e: 'removed'): void
  (e: 'cancel'): void
}>()
const errorMessage = ref<string>('')
const isRemoving = ref(false)

// Matches server/models/Errors.ts CannotRemoveSoleNTHSAdminError in subway.
const SOLE_ADMIN_ERROR_MESSAGE =
  'Cannot remove the only existing admin of a group'

async function soleAdminErrorMessage(): Promise<string> {
  const groupId = props.memberToRemove.nthsGroupId
  try {
    await store.dispatch('nths/fetchNTHSGroupMembers', groupId)
    const members: GroupMember[] =
      store.state.nths.NTHSGroupMembers?.[groupId] ?? []
    const hasOtherCurrentMember = members.some(
      (member) =>
        member.userId !== props.memberToRemove.userId && !member.accountClosed
    )
    return hasOtherCurrentMember
      ? "You're the only admin. Make another member an admin before you leave."
      : "You're the only member, so there's no one to hand the chapter to. Contact us to close it."
  } catch {
    return "You're the only admin. Make another member an admin before you leave."
  }
}

async function removeTeamMember() {
  if (isRemoving.value) return
  isRemoving.value = true
  errorMessage.value = ''
  try {
    const groupId = props.memberToRemove.nthsGroupId
    if (props.isRemovingSelf) {
      await NetworkService.leaveNthsChapter(props.memberToRemove.nthsGroupId)
      store.commit('nths/setNTHSGroupMembers', {
        groupId,
        groupMembers: [],
      })
      await store.dispatch('nths/fetchNthsData')
      await router.push('/dashboard')
    } else {
      await NetworkService.updateNTHSGroupMember(
        groupId,
        props.memberToRemove.userId,
        {
          isActive: false,
        }
      )
      // The Members tab reads the roster endpoint and never fills
      // nths/NTHSGroupMembers, so only filter the cache when Chapter setup
      // has loaded it; committing [] would leave its Leave Team button with
      // no current member.
      const cached = store.state.nths.NTHSGroupMembers?.[groupId]
      if (cached) {
        store.commit('nths/setNTHSGroupMembers', {
          groupId,
          groupMembers: cached.filter(
            (member: GroupMember) =>
              member.userId !== props.memberToRemove.userId
          ),
        })
      }
    }
    emit('removed')
  } catch (err) {
    if (
      props.isRemovingSelf &&
      isNetworkError(err) &&
      err.message === SOLE_ADMIN_ERROR_MESSAGE
    ) {
      errorMessage.value = await soleAdminErrorMessage()
    } else {
      LoggerService.noticeError(
        err,
        `Failed to deactivate member ${props.memberToRemove.userId} from group ${props.memberToRemove.nthsGroupId}`
      )
      errorMessage.value = props.isRemovingSelf
        ? 'Something went wrong while leaving the chapter. Please refresh the page and try again.'
        : `Something went wrong while removing ${props.memberToRemove.firstName} from the chapter. Please refresh the page and try again.`
    }
  } finally {
    isRemoving.value = false
  }
}

function onCancel() {
  emit('cancel')
  if (props.isRemovingSelf) {
    modalStore.hide()
  }
}
</script>

<template>
  <div class="main-container">
    <div
      v-if="errorMessage"
      class="error-container"
      role="alert"
      data-testid="remove-error"
    >
      {{ errorMessage }}
    </div>

    <template v-if="isRemovingSelf">
      <h2 class="title">Leave your NTHS chapter?</h2>
      <p class="body">
        You'll keep your UPchieve account and can keep coaching students. Hours
        you already logged stay on the chapter's total.
      </p>
      <p class="body warning-text">
        This can't be undone. You won't be able to rejoin this chapter.
      </p>
      <div class="actions">
        <LargeButton
          :showArrow="false"
          variant="secondary"
          v-ph:nthshq="'setup.leave_team.cancel'"
          @click="onCancel"
          >Cancel</LargeButton
        >
        <LargeButton
          :showArrow="false"
          variant="danger"
          data-testid="confirm-remove-self"
          v-ph:nthshq="'setup.leave_team.confirm'"
          :disabled="isRemoving"
          @click="removeTeamMember"
          >Leave chapter</LargeButton
        >
      </div>
    </template>

    <template v-else>
      <h2 class="title">
        Remove {{ memberToRemove.firstName }} from the chapter?
      </h2>
      <p class="body">
        They keep their UPchieve account and their tutoring history. Hours they
        already logged stay on your chapter total.
      </p>
      <p class="body warning-text" data-testid="remove-member-permanent">
        This cannot be undone. {{ memberToRemove.firstName }} won't be able to
        rejoin the chapter.
      </p>
      <div class="actions">
        <LargeButton
          :showArrow="false"
          variant="secondary"
          v-ph:nthshq="'remove.cancel'"
          @click="onCancel"
          >Cancel</LargeButton
        >
        <LargeButton
          :showArrow="false"
          variant="danger"
          data-testid="confirm-remove-member"
          v-ph:nthshq="'remove.confirm'"
          :disabled="isRemoving"
          @click="removeTeamMember"
          >Remove member</LargeButton
        >
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  text-align: left;
}

.error-container {
  @include nths-error-box;
  margin-bottom: 32px;
}

.title {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
}
.body {
  @include nths-page-subtitle;
  margin-top: 10px;
}
// After .body, whose subtitle mixin sets a grey color at the same specificity.
.warning-text {
  color: $c-error-red;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
</style>
