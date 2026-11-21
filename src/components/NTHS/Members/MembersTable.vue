<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
import CheckIcon from '@/assets/check.svg'
import CopyIcon from '@/assets/copy-icon.svg'
import CollapseIcon from '@/assets/image-collapse.svg'
import ExpandIcon from '@/assets/image-expand.svg'
import LargeButton from '@/components/LargeButton.vue'
import { avatarColor } from '@/components/NTHS/member-avatar'
import { useInviteLink } from '@/composables/useInviteLink'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import {
  memberStatus,
  type MemberStatus,
} from '@/services/NTHSMembersTableService'
import {
  daysSince,
  DEFAULT_ROSTER_SORT,
  memberDisplayName,
  NEVER_ACTIVE_LABEL,
  sortRoster,
} from '@/services/NTHSRosterService'
import {
  formatHoursMinutes,
  rankMembers,
} from '@/services/NTHSTopMembersService'
import { plural } from '@/utils/plural'

const props = defineProps<{
  members: NTHSRosterMemberPublic[]
  currentUserId: string
  isGroupAdmin: boolean
  inviteCode?: string
  referralCode: string
  now: Date
  isLoading?: boolean
  loadFailed?: boolean
}>()

const STATUSES: Record<MemberStatus, { label: string; tone: string }> = {
  'needs-training': { label: 'Needs training', tone: 'bad' },
  'needs-approval': { label: 'Needs approval', tone: 'bad' },
  'active-this-week': { label: 'Active this week', tone: 'good' },
  'no-hours-this-week': { label: 'No hours this week', tone: 'warn' },
}

const isLoaded = computed(() => !props.isLoading && !props.loadFailed)
const isAlone = computed(
  () =>
    props.isGroupAdmin &&
    (props.members.length === 0 ||
      (props.members.length === 1 &&
        props.members[0].userId === props.currentUserId))
)
const showsTable = computed(() => isLoaded.value && !isAlone.value)
const title = computed(() =>
  showsTable.value
    ? `${props.members.length} ${plural(props.members.length, 'Member')}`
    : 'Members'
)

const ranks = computed(
  () =>
    new Map(
      rankMembers(props.members).map((member, index) => [
        member.userId,
        index + 1,
      ])
    )
)
const rows = computed(() =>
  sortRoster(props.members, DEFAULT_ROSTER_SORT, 'thisSchoolYear').map(
    (member) => {
      const name = memberDisplayName(member)
      const status = STATUSES[memberStatus(member)]
      return {
        userId: member.userId,
        name: member.userId === props.currentUserId ? `${name} (you)` : name,
        rank: ranks.value.get(member.userId),
        color: avatarColor(member.userId),
        hours: formatHoursMinutes(member.periodHours.thisSchoolYear),
        status,
        marks: [
          { label: 'Screen', done: member.safetyApproved },
          { label: 'Training', done: member.trainingComplete },
          { label: '1st', done: member.periodSessions.allTime > 0 },
        ],
        days: daysSince(member.lastActiveAt, props.now),
      }
    }
  )
)

const { link, justCopied, copyLink } = useInviteLink(
  () => props.inviteCode ?? '',
  () => props.referralCode
)

const card = ref<HTMLElement>()
// LargeButton renders a fragment, so a ref on it holds no element to focus.
const expandSlot = ref<HTMLElement>()
const isExpanded = ref(false)
const placeholderHeight = ref(0)

async function focusExpandButton() {
  await nextTick()
  expandSlot.value?.querySelector('button')?.focus()
}

function collapse() {
  isExpanded.value = false
  focusExpandButton()
}

function toggleExpanded() {
  if (isExpanded.value) {
    collapse()
  } else {
    placeholderHeight.value = card.value?.offsetHeight ?? 0
    isExpanded.value = true
    focusExpandButton()
  }
}

function wrapTab(event: KeyboardEvent) {
  const elements = card.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [tabindex="0"]'
  )
  if (!elements?.length) return
  const first = elements[0]
  const last = elements[elements.length - 1]
  const focusIsOutside = !card.value?.contains(document.activeElement)
  if (focusIsOutside) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onKeyStroke('Escape', () => {
  if (isExpanded.value) {
    collapse()
  }
})
onKeyStroke('Tab', (event) => {
  if (isExpanded.value) {
    wrapTab(event)
  }
})
</script>

<template>
  <div
    class="root"
    :style="isExpanded ? { minHeight: `${placeholderHeight}px` } : undefined"
  >
    <div
      v-if="isExpanded"
      class="backdrop"
      @wheel.prevent
      @touchmove.prevent
    ></div>
    <section
      ref="card"
      class="team"
      :class="{ full: isExpanded }"
      aria-labelledby="members-table-title"
      :aria-busy="isLoading"
      data-testid="members-table"
      :role="isExpanded ? 'dialog' : undefined"
      :aria-modal="isExpanded ? 'true' : undefined"
    >
      <div class="top">
        <h2
          id="members-table-title"
          class="title"
          data-testid="members-table-title"
        >
          {{ title }}
        </h2>
        <span v-if="showsTable" ref="expandSlot" class="expand-slot">
          <LargeButton
            class="expand"
            variant="secondary"
            :showArrow="false"
            :aria-label="isExpanded ? 'Collapse table' : 'Expand table'"
            :aria-pressed="isExpanded"
            data-testid="members-table-expand"
            v-ph:nthshq="'home.members_expand'"
            @click="toggleExpanded"
          >
            <CollapseIcon v-if="isExpanded" class="icon" aria-hidden="true" />
            <ExpandIcon v-else class="icon" aria-hidden="true" />
          </LargeButton>
        </span>
      </div>

      <p v-if="loadFailed" class="note" data-testid="members-table-error">
        We couldn't load your members. Refresh the page to try again.
      </p>
      <div
        v-else-if="isLoaded && isAlone"
        class="zero"
        data-testid="members-table-invite"
      >
        <p class="zero-title">Invite your first member</p>
        <p class="zero-body">
          Share your invite link to get your first member. Everyone you recruit
          shows up here.
        </p>
        <button
          type="button"
          class="invite"
          :aria-label="`Copy invite link ${link}`"
          v-ph:nthshq="'home.members_copy_invite'"
          @click="copyLink"
        >
          <span class="url">{{ link }}</span>
          <span class="state" aria-live="polite">
            <template v-if="justCopied">
              <span class="copied">Copied</span>
              <CheckIcon class="state-icon" aria-hidden="true" />
            </template>
            <CopyIcon v-else class="state-icon" aria-hidden="true" />
          </span>
        </button>
      </div>
      <div
        v-else-if="showsTable"
        class="scroll"
        tabindex="0"
        role="region"
        aria-label="Members table"
        data-testid="members-table-scroll"
      >
        <table class="table" :class="{ member: !isGroupAdmin }">
          <colgroup>
            <col class="c-av" />
            <col />
            <col class="c-hrs" />
            <template v-if="isGroupAdmin">
              <col class="c-status" />
              <col class="c-mark" />
              <col class="c-mark" />
              <col class="c-mark" />
            </template>
            <col v-else class="c-days" />
          </colgroup>
          <thead>
            <tr>
              <th class="av"><span class="sr">Rank</span></th>
              <th class="l">Name</th>
              <th class="r">Vol hours</th>
              <template v-if="isGroupAdmin">
                <th class="l">Status</th>
                <th>Screen</th>
                <th>Training</th>
                <th>1st</th>
              </template>
              <th v-else class="r">Days since last session</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.userId"
              data-testid="members-table-row"
            >
              <td class="av">
                <span
                  class="rank-badge"
                  :style="{ background: row.color }"
                  aria-hidden="true"
                >
                  <template v-if="row.rank"
                    ><span class="hash">#</span>{{ row.rank }}</template
                  >
                  <template v-else>&mdash;</template>
                </span>
              </td>
              <th scope="row" class="l name" data-testid="member-name">
                {{ row.name
                }}<span class="sr">{{
                  row.rank ? `, rank ${row.rank}` : ', not ranked yet'
                }}</span>
              </th>
              <td class="r hrs" data-testid="member-hours">{{ row.hours }}</td>
              <template v-if="isGroupAdmin">
                <td class="l" data-testid="member-status">
                  <span class="pill" :class="row.status.tone">{{
                    row.status.label
                  }}</span>
                </td>
                <td
                  v-for="mark in row.marks"
                  :key="mark.label"
                  data-testid="member-marks"
                >
                  <span class="mark" :class="{ done: mark.done }">
                    <span class="sr">{{ mark.done ? 'Done' : 'Not yet' }}</span>
                  </span>
                </td>
              </template>
              <td v-else class="r" data-testid="member-days">
                <template v-if="row.days !== undefined">{{
                  row.days
                }}</template>
                <template v-else>
                  <span aria-hidden="true">&mdash;</span>
                  <span class="sr">{{ NEVER_ACTIVE_LABEL }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.root {
  min-width: 0;
}
.team {
  @include nths-card(24px);
  min-width: 0;
  text-align: left;
}
.team.full {
  position: fixed;
  z-index: get-z('modal');
  inset: 20px;
  overflow: auto;
  overscroll-behavior: contain;
}
.backdrop {
  position: fixed;
  z-index: get-z('modal');
  inset: 0;
  background: rgba(9, 44, 76, 0.45);
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.title {
  @include nths-page-title;
}
.expand-slot {
  display: contents;
}
.expand {
  flex: none;
  padding: 4px 15px;
}
.icon {
  display: block;
  width: 18px;
  height: 18px;
}
.sr {
  @include visually-hidden;
}
.note {
  @include nths-page-subtitle;
  margin-top: 16px;
}
.zero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 20px;
  border-radius: 8px;
  background: $c-background-grey;
}
.zero-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.25;
  margin: 0;
}
.zero-body {
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 8px;
  color: $c-secondary-grey;
}
.invite {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 48px;
  padding: 8px 20px;
  background: $upchieve-white;
  border: 1px solid $c-border-grey;
  border-radius: 200px;
  color: $c-soft-black;
  text-align: left;
  font-size: 16px;
  line-height: 1.5;
  cursor: pointer;

  &:hover {
    border-color: $c-soft-black;
  }
  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
.url {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.state {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $c-information-blue;
}
.copied {
  font-weight: 500;
}
.state-icon {
  width: 20px;
  height: 20px;
}
.scroll {
  overflow-x: auto;
  margin-top: 16px;
  scrollbar-color: $c-border-grey transparent;
  // Shadows that show at an edge only while more of the table sits past it.
  background:
    linear-gradient(to right, $upchieve-white 30%, rgba($upchieve-white, 0))
      left center / 40px 100% no-repeat local,
    linear-gradient(to left, $upchieve-white 30%, rgba($upchieve-white, 0))
      right center / 40px 100% no-repeat local,
    linear-gradient(to right, rgba(9, 44, 76, 0.07), rgba(9, 44, 76, 0)) left
      center / 28px 100% no-repeat scroll,
    linear-gradient(to left, rgba(9, 44, 76, 0.07), rgba(9, 44, 76, 0)) right
      center / 28px 100% no-repeat scroll;

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
.table {
  width: 100%;
  min-width: 784px;
  table-layout: fixed;
  border-collapse: collapse;
}
.table.member {
  min-width: 500px;
}
.c-av {
  width: 48px;
}
.c-hrs {
  width: 110px;
}
.c-status {
  width: 170px;
}
.c-mark {
  width: 92px;
}
.c-days {
  width: 210px;
}
th,
td {
  padding: 16px 6px;
  border-bottom: 1px solid $c-border-grey;
  text-align: center;
  vertical-align: middle;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}
thead th {
  padding: 8px 6px;
  font-size: 14px;
  color: $c-secondary-grey;
}
tbody th {
  color: $c-soft-black;
}
.l {
  text-align: left;
}
.r {
  text-align: right;
}
.hrs {
  font-weight: 500;
}
.rank-badge {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  font-weight: 600;
}
.hash {
  font-size: 12px;
  margin-right: 1px;
}
.pill {
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
.pill.good {
  background: $upchieve-chat-bot-green;
  border-color: $c-success-green;
  color: $c-hover-green;
}
.pill.warn {
  background: rgba($c-volunteer, 0.4);
  border-color: $c-nths-gold;
  color: $c-soft-black;
}
.pill.bad {
  background: rgba($c-error-red, 0.12);
  border-color: $c-error-red;
  color: $c-soft-black;
}
.mark {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  vertical-align: middle;
  border: 1.5px dashed $c-banned-grey;
  border-radius: 50%;
}
.mark.done {
  border: 0;

  &::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 1px;
    width: 6px;
    height: 11px;
    border: solid $c-soft-black;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}
</style>
