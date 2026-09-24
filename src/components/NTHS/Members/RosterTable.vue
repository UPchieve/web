<script setup lang="ts">
import RosterMemberIdentity from '@/components/NTHS/Members/RosterMemberIdentity.vue'
import RosterRowMenu from '@/components/NTHS/Members/RosterRowMenu.vue'
import type {
  RosterRowEmits,
  RosterRowProps,
} from '@/components/NTHS/Members/roster-row'
import RosterPeriodHours from '@/components/NTHS/Members/RosterPeriodHours.vue'
import RosterStatusTag from '@/components/NTHS/Members/RosterStatusTag.vue'
import {
  formatHours,
  formatLastActive,
  formatSessions,
  rosterStatus,
  rosterSortLabel,
  ROSTER_SORT_KEYS,
  type RosterSortKey,
} from '@/services/NTHSRosterService'

const props = defineProps<RosterRowProps>()
defineEmits<RosterRowEmits>()

function ariaSort(key: RosterSortKey) {
  if (props.sort.key !== key) return 'none'
  return props.sort.direction === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="table-scroll" data-testid="roster-table">
    <table class="roster">
      <colgroup>
        <col style="width: 24%" />
        <col style="width: 20%" />
        <col style="width: 14%" />
        <col style="width: 11%" />
        <col style="width: 12%" />
        <col style="width: 15%" />
        <col v-if="canManage" style="width: 56px" />
      </colgroup>
      <thead>
        <tr>
          <th
            v-for="key in ROSTER_SORT_KEYS"
            :key="key"
            scope="col"
            :aria-sort="ariaSort(key)"
            :data-testid="
              key === 'periodHours'
                ? 'roster-period-head'
                : `roster-head-${key}`
            "
          >
            <button
              type="button"
              class="sort-button"
              :data-testid="`roster-sort-${key}`"
              @click="$emit('sort', key)"
            >
              {{ rosterSortLabel(key, period) }}
              <span
                v-if="sort.key === key"
                class="sort-arrow"
                aria-hidden="true"
                >{{ sort.direction === 'asc' ? '↑' : '↓' }}</span
              >
            </button>
          </th>
          <th v-if="canManage" scope="col" data-testid="roster-head-actions">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="member in members"
          :key="member.userId"
          :data-testid="`roster-row-${member.userId}`"
        >
          <td>
            <div class="member">
              <RosterMemberIdentity :member="member" />
            </div>
          </td>
          <td>
            <RosterStatusTag :status="rosterStatus(member)" />
          </td>
          <td>
            <RosterPeriodHours :hours="member.periodHours[period]" />
          </td>
          <td :class="{ muted: member.sessionsThisYear === 0 }">
            {{ formatSessions(member.sessionsThisYear) }}
          </td>
          <td :class="{ muted: member.hoursThisYear === 0 }">
            {{ formatHours(member.hoursThisYear) }}
          </td>
          <td :class="{ 'never-active': !member.lastActiveAt }">
            {{ formatLastActive(member.lastActiveAt, now) }}
          </td>
          <td v-if="canManage" class="actions">
            <RosterRowMenu
              v-if="member.userId !== currentUserId"
              :member="member"
              :open="openMenuUserId === member.userId"
              :busy="busyUserIds.has(member.userId)"
              @toggle="$emit('toggleMenu', member.userId)"
              @close="$emit('closeMenu', member.userId)"
              @changeRole="(role) => $emit('changeRole', member, role)"
              @remove="$emit('remove', member)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.table-scroll {
  overflow-x: auto;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  background: $upchieve-white;
}
.roster {
  table-layout: fixed;
  min-width: 880px;
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
th {
  background: $c-bg;
  border-bottom: 1px solid $c-border-grey;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $c-secondary-grey;
  padding: 14px 24px;
}
td {
  min-width: 0;
  padding: 16px 24px;
  border-top: 1px solid $c-nths-track;
  font-size: 14px;
  line-height: 1.3;
  vertical-align: middle;
  overflow-wrap: break-word;
}
.member {
  display: flex;
  align-items: center;
  gap: 12px;
}
.muted {
  color: $c-secondary-grey;
}
.never-active {
  color: $c-nths-warm-fg;
}
.actions {
  text-align: right;
  // The 56px column only fits the 32px menu button inside its right padding.
  padding-left: 0;
}
.sort-button {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
.sort-arrow {
  color: $c-soft-black;
}
.sr-only {
  @include visually-hidden;
}
</style>
