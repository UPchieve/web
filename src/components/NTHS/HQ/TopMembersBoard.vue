<script setup lang="ts">
import { computed } from 'vue'
import trophyUrl from '@/assets/nths/top-members-trophy.svg?url'
import type { NTHSChapterRosterMemberPublic } from '@upchieve/api-contracts/nths-groups'
import { topMembersBoard } from '@/services/NTHSTopMembersService'

const props = defineProps<{
  members: NTHSChapterRosterMemberPublic[]
  currentUserId: string
  isLoading?: boolean
}>()

const PLACE_CLASSES = ['first', 'second', 'third']

const board = computed(() =>
  props.isLoading
    ? { rows: [] }
    : topMembersBoard(props.members, props.currentUserId)
)
const isEmpty = computed(() => !props.isLoading && !board.value.rows.length)
</script>

<template>
  <section
    class="top"
    aria-labelledby="top-members-title"
    :aria-busy="isLoading"
    data-testid="top-members"
  >
    <h2 id="top-members-title" class="eyebrow">Top members</h2>
    <div v-if="isLoading" class="skeleton" aria-hidden="true">
      <span v-for="n in 3" :key="n" class="skeleton-row"></span>
    </div>
    <p v-else-if="isEmpty" class="note" data-testid="top-members-empty">
      No hours logged yet. The first tutoring hour puts a member on the board.
    </p>
    <div v-else class="board">
      <ol>
        <li
          v-for="(row, index) in board.rows"
          :key="row.userId"
          class="row"
          :class="PLACE_CLASSES[index]"
          data-testid="top-members-row"
        >
          <span class="hrs">{{ row.hours }}</span>
          <span class="who">
            <span class="rank">#{{ row.place }}</span>
            <b>{{ row.name }}</b>
            <small v-if="row.line">{{ row.line }}</small>
          </span>
          <img
            v-if="index === 0"
            class="trophy"
            :src="trophyUrl"
            alt=""
            width="56"
            height="56"
          />
        </li>
      </ol>
      <div
        v-if="board.viewerRow"
        class="row you"
        data-testid="top-members-viewer-row"
      >
        <span class="hrs">{{ board.viewerRow.hours }}</span>
        <span class="who">
          <span class="rank">
            <template v-if="board.viewerRow.place">
              #{{ board.viewerRow.place }}
            </template>
          </span>
          <b>{{ board.viewerRow.name }}</b>
          <small>{{ board.viewerRow.line }}</small>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.eyebrow {
  @include nths-section-eyebrow;
  margin: 0;
  font-weight: 500;
  color: $c-soft-black;
}
.note {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  margin: 8px 0 0;
  padding: 20px;
  border-radius: 8px;
  background: $upchieve-white;
  color: $c-secondary-grey;
}
.skeleton {
  @include nths-skeleton-rows(52px, 8px);
}
.board {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 16px;
}
ol,
.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}
ol {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  row-gap: 8px;
}
.row {
  position: relative;
  align-items: center;
  padding: 8px 48px 8px 16px;
  border-radius: 8px;
}
.first {
  background: $c-volunteer;
}
.second {
  background: $c-teacher;
}
.third {
  background: $c-student;
}
.you {
  background: $upchieve-white;
  border: 1px solid $c-border-grey;
  margin-top: 16px;
  padding-right: 16px;
}
.hrs {
  font-size: 24px;
  font-weight: 500;
  line-height: 1;
}
.who {
  display: grid;
  grid-template-columns: 2.25em minmax(0, 1fr);
  align-items: baseline;
  min-width: 0;

  b {
    font-size: 18px;
    font-weight: 500;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  small {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    grid-column: 2;
  }
}
.rank {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}
.trophy {
  position: absolute;
  right: -12px;
  top: -30px;
  width: 56px;
  height: 56px;
}
</style>
