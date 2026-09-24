<script setup lang="ts">
import RosterMemberIdentity from '@/components/NTHS/Members/RosterMemberIdentity.vue'
import RosterRowMenu from '@/components/NTHS/Members/RosterRowMenu.vue'
import type {
  RosterRowEmits,
  RosterRowProps,
} from '@/components/NTHS/Members/roster-row'
import RosterPeriodActivity from '@/components/NTHS/Members/RosterPeriodActivity.vue'
import RosterStatusTag from '@/components/NTHS/Members/RosterStatusTag.vue'
import {
  formatLastActive,
  ROSTER_PERIOD_LABELS,
  rosterStatus,
} from '@/services/NTHSRosterService'

defineProps<RosterRowProps>()
defineEmits<RosterRowEmits>()
</script>

<template>
  <div class="cards" data-testid="roster-cards">
    <article
      v-for="member in members"
      :key="member.userId"
      class="card"
      :data-testid="`roster-row-${member.userId}`"
    >
      <div class="card-top">
        <RosterMemberIdentity :member="member" />
        <RosterRowMenu
          v-if="canManage && member.userId !== currentUserId"
          :member="member"
          :open="openMenuUserId === member.userId"
          :busy="busyUserIds.has(member.userId)"
          @toggle="$emit('toggleMenu', member.userId)"
          @close="$emit('closeMenu', member.userId)"
          @changeRole="(role) => $emit('changeRole', member, role)"
          @remove="$emit('remove', member)"
        />
      </div>

      <div class="meta">
        <RosterStatusTag :status="rosterStatus(member)" />
        <span class="period">
          {{ ROSTER_PERIOD_LABELS[period] }}
          <RosterPeriodActivity
            :sessions="member.periodSessions[period]"
            :hours="member.periodHours[period]"
          />
        </span>
        <span
          class="last-active"
          :class="{ 'never-active': !member.lastActiveAt }"
          >{{ formatLastActive(member.lastActiveAt, now) }}</span
        >
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  @include nths-card(16px 18px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  .row-menu {
    margin-left: auto;
  }
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-size: 13px;
  line-height: 1.3;
}
.period {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $c-secondary-grey;
}
.last-active {
  color: $c-soft-black;
}
.last-active.never-active {
  color: $c-nths-warm-fg;
}
</style>
