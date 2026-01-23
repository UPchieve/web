<script lang="ts" setup>
import MemberRoleDropdown from '@/views/NTHS/MemberRoleDropdown.vue'
import { useStore } from 'vuex'
import type { GroupMember } from '@/types/nths-types'
import Loader from '@/components/Loader.vue'

export type ManageTeamModalProps = {
  members: GroupMember[]
  isLoading: boolean
}

const props = defineProps<ManageTeamModalProps>()
const store = useStore()

function isCurrentUser(userId: string): boolean {
  return userId === store.state.user.user.id
}
</script>

<template>
  <div>
    <h1>Manage team members</h1>
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
          {{ member.firstName }}
        </div>
        <MemberRoleDropdown
          :groupMember="member"
          :disabled="isCurrentUser(member.userId)"
          class="status member-cell"
          :class="{
            'bottom-border': index !== props.members.length - 1,
          }"
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
</style>
