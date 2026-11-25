<script setup lang="ts">
import { onKeyStroke, refAutoReset } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
import CheckIcon from '@/assets/check.svg'
import CopyIcon from '@/assets/copy-icon.svg'
import DownloadIcon from '@/assets/download.svg'
import CollapseIcon from '@/assets/image-collapse.svg'
import ExpandIcon from '@/assets/image-expand.svg'
import SortArrowIcon from '@/assets/sort-arrow.svg'
import LargeButton from '@/components/LargeButton.vue'
import { avatarColor } from '@/components/NTHS/member-avatar'
import RosterRowMenu from '@/components/NTHS/Members/RosterRowMenu.vue'
import SubjectList from '@/components/NTHS/Members/SubjectList.vue'
import { useInviteLink } from '@/composables/useInviteLink'
import type { NTHSChapterRosterMemberPublic } from '@upchieve/api-contracts/nths-groups'
import {
  DEFAULT_MEMBER_SORT,
  defaultDirection,
  filterMembers,
  memberFilters,
  memberHours,
  memberSessions,
  memberStatus,
  nextMemberSort,
  sortMembers,
  type MemberFilter,
  type MemberSort,
  type MemberSortKey,
  type MemberStatus,
} from '@/services/NTHSMembersTableService'
import {
  daysSince,
  downloadRosterCsv,
  memberDisplayName,
  NEVER_ACTIVE_LABEL,
  ROSTER_LOAD_ERROR,
  roleTagLabel,
  rosterMemberActions,
  type RosterMemberAction,
  type RosterRange,
} from '@/services/NTHSRosterService'
import { rankMembers } from '@/services/NTHSTopMembersService'
import { plural } from '@/utils/plural'
import { formatHoursMinutes } from '@/utils/time-utils'

const props = defineProps<{
  members: NTHSChapterRosterMemberPublic[]
  currentUserId: string
  isGroupAdmin: boolean
  inviteCode?: string
  referralCode: string
  now: Date
  isLoading?: boolean
  isReloading?: boolean
  loadFailed?: boolean
  schoolYearLabel: string
  // Set on the Manage tab, whose hours, sessions and status follow it.
  range?: RosterRange
  busyUserIds?: ReadonlySet<string>
}>()
const emit = defineEmits<{
  act: [member: NTHSChapterRosterMemberPublic, action: RosterMemberAction]
}>()
const activeSort = defineModel<MemberSort>('sort', {
  default: () => DEFAULT_MEMBER_SORT,
})

const STATUSES: Record<MemberStatus, { label: string; tone: string }> = {
  'account-closed': { label: 'Account closed', tone: 'closed' },
  'needs-training': { label: 'Needs training', tone: 'bad' },
  'needs-approval': { label: 'Needs approval', tone: 'bad' },
  'active-this-week': { label: 'Active this week', tone: 'good' },
  'no-hours-this-week': { label: 'No hours this week', tone: 'warn' },
  active: { label: 'Active', tone: 'good' },
  'no-hours': { label: 'No hours', tone: 'warn' },
}

const SORT_LABELS: Record<MemberSortKey, string> = {
  name: 'Name',
  hours: 'Vol hours',
  sessions: 'Sessions',
  role: 'Role',
  status: 'Status',
  screen: 'Screen',
  training: 'Training',
  first: '1st',
  days: 'Days since last session',
  students: 'Students helped',
  subjects: 'Subjects',
}

const scope = computed(() => (props.range ? 'range' : 'home'))

function phKey(name: string) {
  return props.range ? `members.${name}` : `home.members_${name}`
}

const isLoaded = computed(() => !props.isLoading && !props.loadFailed)
const isAlone = computed(
  () =>
    !props.range &&
    props.isGroupAdmin &&
    (props.members.length === 0 ||
      (props.members.length === 1 &&
        props.members[0].userId === props.currentUserId))
)
const showsTable = computed(() => isLoaded.value && !isAlone.value)
const showsTools = computed(() => showsTable.value && props.isGroupAdmin)
// A failed range reload keeps the picker so the range can be changed back, but
// not the filter chips, whose counts would come from the previous range.
const showsFilterRow = computed(
  () =>
    showsTools.value ||
    (!!props.range && props.loadFailed && props.isGroupAdmin)
)
const currentCount = computed(
  () => props.members.filter((member) => !member.accountClosed).length
)
const title = computed(() =>
  showsTable.value
    ? `${currentCount.value} ${plural(currentCount.value, 'Member')}`
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

const activeFilter = ref<MemberFilter>('everyone')
const openMenuUserId = ref<string>()
const visibleMembers = computed(() =>
  sortMembers(
    filterMembers(props.members, activeFilter.value, scope.value),
    activeSort.value,
    props.now,
    scope.value
  )
)
const rows = computed(() =>
  visibleMembers.value.map((member) => {
    const name = memberDisplayName(member)
    const status = STATUSES[memberStatus(member, scope.value)]
    return {
      member,
      userId: member.userId,
      name: member.userId === props.currentUserId ? `${name} (you)` : name,
      initial: member.firstName.charAt(0).toUpperCase(),
      rank: props.range ? undefined : ranks.value.get(member.userId),
      color: avatarColor(member.userId),
      hours: formatHoursMinutes(memberHours(member, scope.value)),
      sessions: memberSessions(member, scope.value),
      role: roleTagLabel(member, props.members) ?? 'Member',
      status,
      marks: [
        { label: 'Screen', done: member.safetyApproved },
        { label: 'Training', done: member.trainingComplete },
        { label: '1st', done: member.periodSessions.thisSchoolYear > 0 },
      ],
      days: daysSince(member.lastActiveAt, props.now),
      students: member.studentsHelpedThisYear,
      subjects: member.subjects,
    }
  })
)

const columns = computed<{ key: MemberSortKey; align: string; col?: string }[]>(
  () => {
    if (props.range) {
      return [
        { key: 'name', align: 'l' },
        { key: 'hours', align: 'r', col: 'c-hrs' },
        { key: 'sessions', align: 'r', col: 'c-num' },
        { key: 'role', align: 'l', col: 'c-role' },
        { key: 'status', align: 'l', col: 'c-status' },
        { key: 'screen', align: '', col: 'c-mark' },
        { key: 'training', align: '', col: 'c-mark' },
        { key: 'first', align: '', col: 'c-mark' },
        { key: 'subjects', align: 'l', col: 'c-subj' },
      ]
    }
    return props.isGroupAdmin
      ? [
          { key: 'name', align: 'l' },
          { key: 'hours', align: 'r', col: 'c-hrs' },
          { key: 'status', align: 'l', col: 'c-status' },
          { key: 'screen', align: '', col: 'c-mark' },
          { key: 'training', align: '', col: 'c-mark' },
          { key: 'first', align: '', col: 'c-mark' },
          { key: 'subjects', align: 'l', col: 'c-subj' },
        ]
      : [
          { key: 'name', align: 'l' },
          { key: 'hours', align: 'r', col: 'c-hrs' },
          { key: 'students', align: 'r', col: 'c-students' },
          { key: 'subjects', align: 'r', col: 'c-num' },
          { key: 'days', align: 'r', col: 'c-days' },
        ]
  }
)
const selectKeys = computed<MemberSortKey[]>(() => {
  if (props.range)
    return ['name', 'hours', 'sessions', 'role', 'status', 'subjects']
  return props.isGroupAdmin
    ? ['name', 'status', 'hours', 'subjects']
    : ['name', 'hours', 'students', 'subjects', 'days']
})

const selectValue = computed(() =>
  !(
    activeSort.value.key === DEFAULT_MEMBER_SORT.key &&
    activeSort.value.direction === DEFAULT_MEMBER_SORT.direction
  ) && selectKeys.value.includes(activeSort.value.key)
    ? activeSort.value.key
    : ''
)

function selectFilter(filter: MemberFilter) {
  activeFilter.value = filter
  openMenuUserId.value = undefined
}

function toggleMenu(userId: string) {
  openMenuUserId.value = openMenuUserId.value === userId ? undefined : userId
}

// The previous row's outside-click listener is still attached during the click
// that opens another row, so its close must not clear the new row's menu.
function closeMenu(userId: string) {
  if (openMenuUserId.value === userId) {
    openMenuUserId.value = undefined
  }
}

function act(
  member: NTHSChapterRosterMemberPublic,
  action: RosterMemberAction
) {
  openMenuUserId.value = undefined
  emit('act', member, action)
}

function filterLabel(filter: MemberFilter) {
  return filter === 'everyone' ? 'Everyone' : STATUSES[filter].label
}

function ariaSort(key: MemberSortKey) {
  if (activeSort.value.key !== key) return 'none'
  return activeSort.value.direction === 'asc' ? 'ascending' : 'descending'
}

function sortBy(key: MemberSortKey) {
  activeSort.value = nextMemberSort(activeSort.value, key)
}

function selectSort(event: Event) {
  const key = (event.target as HTMLSelectElement).value as MemberSortKey | ''
  activeSort.value = key
    ? { key, direction: defaultDirection(key) }
    : DEFAULT_MEMBER_SORT
}

const justDownloaded = refAutoReset(false, 2000)

function download() {
  downloadRosterCsv(visibleMembers.value, {
    roster: props.members,
    range: props.range,
    schoolYearLabel: props.schoolYearLabel,
  })
  justDownloaded.value = true
}

const { displayLink, justCopied, copyLink } = useInviteLink(
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

// Vuetify menus teleport outside the card; their own focus handling owns Tab
// and Escape while focus is inside one.
function focusIsInMenu() {
  return !!document.activeElement?.closest('.v-overlay-container')
}

function wrapTab(event: KeyboardEvent) {
  const elements = Array.from(
    card.value?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), select, [tabindex="0"]'
    ) ?? []
  ).filter((element) => element.checkVisibility?.() ?? true)
  if (!elements.length) return
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
  if (isExpanded.value && !focusIsInMenu()) {
    collapse()
  }
})
onKeyStroke('Tab', (event) => {
  if (isExpanded.value && !focusIsInMenu()) {
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
      :aria-busy="isLoading || isReloading"
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
        <div v-if="showsTable" class="tools">
          <span ref="expandSlot" class="expand-slot">
            <LargeButton
              class="expand"
              variant="secondary"
              :showArrow="false"
              :aria-label="isExpanded ? 'Collapse table' : 'Expand table'"
              :aria-pressed="isExpanded"
              data-testid="members-table-expand"
              v-ph:nthshq="phKey('expand')"
              @click="toggleExpanded"
            >
              <CollapseIcon v-if="isExpanded" class="icon" aria-hidden="true" />
              <ExpandIcon v-else class="icon" aria-hidden="true" />
            </LargeButton>
          </span>
          <LargeButton
            v-if="showsTools"
            class="download"
            variant="secondary"
            :showArrow="false"
            :disabled="justDownloaded || !visibleMembers.length"
            :aria-label="justDownloaded ? 'Downloaded' : 'Download member list'"
            data-testid="members-table-download"
            v-ph:nthshq="phKey('download')"
            @click="download"
          >
            <CheckIcon v-if="justDownloaded" class="icon" aria-hidden="true" />
            <DownloadIcon v-else class="icon" aria-hidden="true" />
          </LargeButton>
          <span class="sr" aria-live="polite">{{
            justDownloaded ? 'Downloaded' : ''
          }}</span>
        </div>
      </div>

      <div
        v-if="showsFilterRow"
        class="chips"
        role="group"
        aria-labelledby="members-table-show"
      >
        <span id="members-table-show" class="show">Show</span>
        <div v-if="$slots.range" class="range-slot">
          <slot name="range" />
        </div>
        <template v-if="showsTools">
          <button
            v-for="filter in memberFilters(scope)"
            :key="filter"
            type="button"
            class="chip"
            :class="{ on: filter === activeFilter }"
            :aria-pressed="filter === activeFilter"
            :data-testid="`members-table-chip-${filter}`"
            v-ph:nthshq="phKey(`filter.${filter}`)"
            @click="selectFilter(filter)"
          >
            {{ filterLabel(filter) }} ({{
              filterMembers(members, filter, scope).length
            }})
          </button>
        </template>
      </div>
      <label v-if="showsTable" class="msort">
        <span>Sort by</span>
        <select
          :value="selectValue"
          autocomplete="off"
          data-testid="members-table-sort-select"
          v-ph:nthshq="phKey('sort_select')"
          @change="selectSort"
        >
          <option value="">Default order</option>
          <option v-for="key in selectKeys" :key="key" :value="key">
            {{ SORT_LABELS[key] }}
          </option>
        </select>
      </label>

      <p v-if="loadFailed" class="note" data-testid="members-table-error">
        {{ ROSTER_LOAD_ERROR }}
      </p>
      <div v-else-if="isLoading" class="skeleton" aria-hidden="true">
        <span v-for="n in 3" :key="n" class="skeleton-row"></span>
      </div>
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
          :aria-label="`Copy invite link ${displayLink}`"
          v-ph:nthshq="phKey('copy_invite')"
          @click="copyLink"
        >
          <span class="url">{{ displayLink }}</span>
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
        <table
          class="table"
          :class="{ member: !isGroupAdmin && !range, range: !!range }"
        >
          <colgroup>
            <col class="c-av" />
            <col
              v-for="column in columns"
              :key="column.key"
              :class="column.col"
            />
            <col v-if="range" class="c-menu" />
          </colgroup>
          <thead>
            <tr>
              <th class="av">
                <span v-if="!range" class="sr">Rank</span>
              </th>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="column.align"
                :aria-sort="ariaSort(column.key)"
                :data-testid="`members-table-th-${column.key}`"
              >
                <button
                  type="button"
                  class="sort"
                  :data-testid="`members-table-sort-${column.key}`"
                  v-ph:nthshq="phKey(`sort.${column.key}`)"
                  @click="sortBy(column.key)"
                >
                  {{ SORT_LABELS[column.key] }}
                  <SortArrowIcon
                    class="arr"
                    :class="{
                      on: activeSort.key === column.key,
                      desc:
                        activeSort.key === column.key &&
                        activeSort.direction === 'desc',
                    }"
                    aria-hidden="true"
                  />
                  <v-tooltip
                    v-if="column.key === 'first'"
                    activator="parent"
                    location="bottom end"
                    :offset="6"
                    max-width="280"
                    open-on-focus
                  >
                    Tutored at least once this school year
                  </v-tooltip>
                </button>
              </th>
              <th v-if="range"><span class="sr">Actions</span></th>
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
                  <template v-if="range">{{ row.initial }}</template>
                  <template v-else-if="row.rank"
                    ><span class="hash">#</span>{{ row.rank }}</template
                  >
                  <template v-else>&mdash;</template>
                </span>
              </td>
              <th scope="row" class="l name" data-testid="member-name">
                {{ row.name
                }}<span v-if="!range" class="sr">{{
                  row.rank ? `, rank ${row.rank}` : ', not ranked yet'
                }}</span>
              </th>
              <td
                class="r hrs"
                data-label="Vol hours"
                data-testid="member-hours"
              >
                {{ row.hours }}
              </td>
              <template v-if="range">
                <td
                  class="r"
                  data-label="Sessions"
                  data-testid="member-sessions"
                >
                  {{ row.sessions }}
                </td>
                <td class="l" data-label="Role" data-testid="member-role">
                  {{ row.role }}
                </td>
              </template>
              <template v-if="range || isGroupAdmin">
                <td class="l" data-label="Status" data-testid="member-status">
                  <span class="pill" :class="row.status.tone">{{
                    row.status.label
                  }}</span>
                </td>
                <td
                  v-for="mark in row.marks"
                  :key="mark.label"
                  :data-label="mark.label"
                  data-testid="member-marks"
                >
                  <span class="mark" :class="{ done: mark.done }">
                    <span class="sr">{{ mark.done ? 'Done' : 'Not yet' }}</span>
                  </span>
                </td>
                <td
                  class="l subj"
                  data-label="Subjects"
                  data-testid="member-subjects"
                >
                  <SubjectList :subjects="row.subjects" />
                </td>
              </template>
              <template v-else>
                <td
                  class="r"
                  data-label="Students helped"
                  data-testid="member-students"
                >
                  {{ row.students }}
                </td>
                <td
                  class="r"
                  data-label="Subjects"
                  data-testid="member-subject-count"
                >
                  {{ row.subjects.length }}
                </td>
                <td
                  class="r"
                  data-label="Days since last session"
                  data-testid="member-days"
                >
                  <template v-if="row.days !== undefined">{{
                    row.days
                  }}</template>
                  <template v-else>
                    <span aria-hidden="true">&mdash;</span>
                    <span class="sr">{{ NEVER_ACTIVE_LABEL }}</span>
                  </template>
                </td>
              </template>
              <td v-if="range" class="menu">
                <RosterRowMenu
                  :member="row.member"
                  :actions="rosterMemberActions(row.member, currentUserId)"
                  :open="openMenuUserId === row.userId"
                  :busy="busyUserIds?.has(row.userId)"
                  @toggle="toggleMenu(row.userId)"
                  @close="closeMenu(row.userId)"
                  @act="(action) => act(row.member, action)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="showsTable && !rows.length"
        class="empty"
        data-testid="members-table-empty"
      >
        No one here right now.
      </p>
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
.tools {
  display: flex;
  flex: none;
  gap: 8px;
}
.expand,
.download {
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
.skeleton {
  @include nths-skeleton-rows(48px, 16px);
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
  min-width: 1004px;
  table-layout: fixed;
  border-collapse: collapse;
}
.table.member {
  min-width: 730px;
}
.table.range {
  min-width: 1120px;

  .c-hrs {
    width: 96px;
  }
  .c-status {
    width: 140px;
  }
  .c-mark {
    width: 80px;
  }
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
.c-num {
  width: 90px;
}
.c-students {
  width: 140px;
}
.c-role {
  width: 130px;
}
.c-subj {
  width: 220px;
}
.c-menu {
  width: 48px;
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
  white-space: nowrap;
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
.pill.closed {
  background: $c-background-grey;
  border-color: $c-border-grey;
  color: $c-secondary-grey;
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
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
.show {
  padding-right: 8px;
  font-size: 14px;
  color: $c-secondary-grey;
}
.chip {
  min-height: 32px;
  padding: 4px 16px;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
  background: $upchieve-white;
  color: $c-soft-black;
  font-size: 14px;
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
.chip.on {
  background: $c-soft-black;
  border-color: $c-soft-black;
  color: $upchieve-white;
}
.sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: $c-soft-black;
  }
  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
.r .sort {
  flex-direction: row-reverse;
}
.arr {
  flex: none;
  width: 12px;
  height: 12px;
  opacity: 0.3;
}
.arr.on {
  opacity: 1;
  color: $c-soft-black;
}
.arr.desc {
  transform: rotate(180deg);
}
.msort {
  display: none;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: $c-secondary-grey;

  select {
    min-height: 44px;
    appearance: none;
    padding: 0 40px 0 16px;
    border: 1px solid $c-border-grey;
    border-radius: 4px;
    background: $upchieve-white
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8' viewBox='0 0 14 8' fill='none'%3E%3Cpath d='M1 1l6 6 6-6' stroke='%2377778b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
      no-repeat right 14px center;
    color: $c-soft-black;
    font: inherit;
    cursor: pointer;
  }
}
.empty {
  margin: 16px 0 0;
  color: $c-secondary-grey;
}

@include breakpoint-below('medium') {
  .msort {
    display: flex;
  }
  .chips {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .chips > .show,
  .chips > .range-slot {
    grid-column: 1 / -1;
  }
  .chip {
    min-height: 44px;
  }
  .table,
  .table.member,
  .table.range,
  .table tbody {
    display: block;
    min-width: 0;
  }
  .table colgroup,
  .table thead {
    display: none;
  }
  .table tr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 0;
    margin-bottom: 8px;
    padding: 16px;
    background: $c-background-grey;
    border-radius: 8px;
  }
  .table td,
  .table tbody th {
    display: block;
    padding: 0;
    border: 0;
    text-align: left;
  }
  .table td.av {
    flex: none;
    margin-right: 8px;
  }
  .table.range tr {
    position: relative;
  }
  .table.range td.hrs {
    margin-right: 40px;
  }
  .table td.menu {
    position: absolute;
    top: 16px;
    right: 16px;
  }
  .table tbody th.name {
    flex: 1 1 calc(100% - 48px);
    min-width: 0;
  }
  .table td[data-label] {
    flex: 0 0 50%;
    min-width: 0;
    padding-right: 8px;

    &::before {
      content: attr(data-label);
      display: block;
      margin-bottom: 2px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.25;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: $c-secondary-grey;
    }
  }
  .table:not(.member) tr {
    gap: 8px 0;
    margin-bottom: 16px;
    background: $upchieve-white;
    border: 1px solid $c-border-grey;
  }
  .table:not(.member) tbody th.name {
    flex: 1 1 0;
    font-weight: 500;
  }
  .table:not(.member) td.hrs {
    flex: none;
    padding-right: 0;
    text-align: right;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    color: $c-soft-black;

    &::before {
      text-align: right;
      text-transform: none;
      letter-spacing: 0;
      font-weight: 400;
    }
  }
  .table td[data-label='Status'] {
    flex-basis: 100%;
    padding-right: 0;

    &::before {
      display: none;
    }
  }
  .table td.subj {
    flex-basis: 100%;
    padding-right: 0;
  }
  .table td[data-label='Screen'],
  .table td[data-label='Training'],
  .table td[data-label='1st'] {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 6px;
    padding-right: 16px;

    &::before {
      order: 2;
      margin: 0;
      text-transform: none;
      letter-spacing: 0;
    }
  }
}
</style>
