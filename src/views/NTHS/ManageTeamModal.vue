<script lang="ts" setup>
import MemberRoleDropdown from '@/views/NTHS/MemberRoleDropdown.vue'
import { useStore } from 'vuex'
import type { GroupMember } from '@/types/nths-types'
import Loader from '@/components/Loader.vue'
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import { ref } from 'vue'

export type ManageTeamModalProps = {
  members: GroupMember[]
  isLoading: boolean
}

const props = defineProps<ManageTeamModalProps>()
const store = useStore()

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
</script>

<template>
  <div>
    <h1>Manage team members</h1>
    <div v-if="errorMessage" class="error-container">
      {{ errorMessage }}
    </div>
    <Loader v-if="props.isLoading" />
    <div class="member-grid" v-else>
      <div class="table-heading name-heading">Name</div>
      <div class="table-heading status-heading">Status</div>
      <div
        v-for="(member, index) in props.members"
        :key="member.userId"
        class="member-row"
      >
        <div
          class="name member-cell"
          :class="{
            'bottom-border': index !== props.members.length - 1,
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
          :disabled="isCurrentUser(member.userId)"
          class="status member-cell"
          :class="{
            'bottom-border': index !== props.members.length - 1,
          }"
          @error="() => onUpdateError(member.firstName)"
          @success="errorMessage = ''"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
h1 {
  @include font-category('display-small');
  padding-bottom: 24px;
}

.member-grid {
  display: grid;
  grid-template-columns: [name] 1fr [status] 1fr;
  border: 1px solid $c-border-grey;
  border-radius: 8px;

  @include breakpoint-below('small') {
    grid-template-columns: [name] minmax(0, 0.5fr) [status] 1fr;
  }

  .table-heading {
    @include font-category('subheading');
    display: flex;
    padding: 16px;
    border-bottom: 1px solid $c-border-grey;

    .name-heading {
      grid-column: name;
    }

    .status-heading {
      grid-column: status;
    }
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
}

.error-container {
  border: 1px solid $c-error-red;
  border-radius: 8px;
  background-color: lighten($c-error-red, 30%);
  padding: 16px;
  margin-bottom: 32px;
}
</style>
