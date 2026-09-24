<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useStore } from 'vuex'
import Loader from '@/components/Loader.vue'
import LargeButton from '@/components/LargeButton.vue'
import RosterCards from '@/components/NTHS/Members/RosterCards.vue'
import RosterFilterChips from '@/components/NTHS/Members/RosterFilterChips.vue'
import RosterSortControl from '@/components/NTHS/Members/RosterSortControl.vue'
import RosterTable from '@/components/NTHS/Members/RosterTable.vue'
import TopTutorCard from '@/components/NTHS/TopTutorCard.vue'
import { useChapterImpact } from '@/composables/useChapterImpact'
import { useChapterRoster } from '@/composables/useChapterRoster'
import { useRosterPreferences } from '@/composables/useRosterPreferences'
import LoggerService from '@/services/LoggerService'
import ModalService from '@/services/ModalService'
import NetworkService from '@/services/NetworkService'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import { formatProgressHours } from '@/services/NTHSImpactService'
import {
  downloadRosterCsv,
  filterRoster,
  nextRosterSort,
  ROSTER_PERIOD_LABELS,
  ROSTER_PERIOD_PHRASES,
  ROSTER_PERIODS,
  rosterFilterCounts,
  rosterPeriodStarts,
  sortRoster,
  type RosterFilter,
  type RosterPeriod,
  type RosterSortKey,
} from '@/services/NTHSRosterService'
import { plural } from '@/utils/plural'

const store = useStore()
const group = computed(() => store.state.nths.NTHSGroups?.[0])
const groupId = computed(() => group.value?.groupInfo?.id)
const currentUserId = computed(() => store.state.user.user.id)
const isGroupAdmin = computed(() => store.getters['nths/hasAdminRole'])

const {
  members,
  schoolYear,
  topTutorThisMonth,
  isLoading,
  loadFailed,
  load,
  refresh: refreshRoster,
  patchMember,
  dropMember,
} = useChapterRoster()
const {
  impact,
  isLoading: isImpactLoading,
  loadFailed: impactLoadFailed,
  load: loadImpact,
  refresh: refreshImpact,
} = useChapterImpact()

// Read once per page load: the period starts sent to the API and Last active
// both come from it, so a row cannot change underneath the viewer.
const now = new Date()

const activeFilter = ref<RosterFilter>('all')
const { period: activePeriod, sort: activeSort } = useRosterPreferences(
  currentUserId.value
)
const openMenuUserId = ref<string>()
const busyUserIds = ref(new Set<string>())
const errorMessage = ref('')

// Must match RosterTable.vue's own min-width: below it the table would clip
// rather than scroll usefully, so cards take over.
const ROSTER_TABLE_MIN_WIDTH = 880
const rosterAreaRef = ref<HTMLElement>()
const { width: rosterAreaWidth } = useElementSize(rosterAreaRef)
const isStacked = computed(() => rosterAreaWidth.value < ROSTER_TABLE_MIN_WIDTH)

onBeforeMount(async () => {
  if (groupId.value) {
    await Promise.all([
      load(groupId.value, now),
      loadImpact(groupId.value, now),
    ])
  }
})

const rosterLoaded = computed(() => !isLoading.value && !loadFailed.value)
const impactLoaded = computed(
  () => !isImpactLoading.value && !impactLoadFailed.value
)

const counts = computed(() =>
  rosterFilterCounts(members.value, activePeriod.value)
)
const visibleMembers = computed(() =>
  sortRoster(
    filterRoster(members.value, activeFilter.value, activePeriod.value),
    activeSort.value,
    activePeriod.value
  )
)
// A closed account is not a current member of the chapter, so it is excluded
// from the roster count even though its row still appears under "All".
const currentMembers = computed(() =>
  members.value.filter((m) => !m.accountClosed)
)
// The viewer is always a current member, so a count of 1 means nobody else
// has joined yet.
const onlyViewerOnRoster = computed(() => currentMembers.value.length <= 1)
const activeMemberCount = computed(() => currentMembers.value.length)
const tutoredInPeriodCount = computed(
  () =>
    currentMembers.value.filter((m) => m.periodHours[activePeriod.value] > 0)
      .length
)
// Read from the same /impact endpoint as Home. The roster's own sums leave
// departed members out, so summing rows would disagree with Home.
const tutoredThisYearCount = computed(
  () => impact.value?.schoolYearToDate.membersTutoring ?? 0
)
// The member count comes from the roster alone, so it still shows if /impact
// is slow or fails; the impact-derived segments only join it once loaded.
const summary = computed(() => {
  const memberCount = `${activeMemberCount.value} active ${plural(activeMemberCount.value, 'member')}`
  if (!impactLoaded.value || !impact.value) return memberCount
  // Floored like Home's hours meter, so the two never disagree.
  const hours = formatProgressHours(
    impact.value.schoolYearToDate.hoursTutored,
    impact.value.goals.hoursTutored
  )
  return `${memberCount} · ${tutoredThisYearCount.value} tutored this year · ${hours} ${plural(hours, 'hour')} this school year`
})

function selectPeriod(period: RosterPeriod) {
  activePeriod.value = period
  openMenuUserId.value = undefined
}

function selectFilter(filter: RosterFilter) {
  activeFilter.value = filter
  openMenuUserId.value = undefined
}

function sortBy(key: RosterSortKey) {
  activeSort.value = nextRosterSort(activeSort.value, key)
}

function downloadCsv() {
  downloadRosterCsv(visibleMembers.value, {
    period: activePeriod.value,
    periodStarts: rosterPeriodStarts(now),
    schoolYearLabel: schoolYear.value!.label,
  })
}

function toggleMenu(userId: string) {
  openMenuUserId.value = openMenuUserId.value === userId ? undefined : userId
}

// The previous row's outside-click listener is still attached during the click
// that opens another row, so its close must not clear the new row's menu.
function closeMenu(userId: string) {
  if (openMenuUserId.value === userId) openMenuUserId.value = undefined
}

// Top tutor eligibility depends on role and membership, so a change can move
// the card and the summary counts.
function refreshAfterMembershipChange() {
  refreshRoster(groupId.value, now)
  refreshImpact(groupId.value, now)
}

async function changeRole(
  member: NTHSRosterMemberPublic,
  roleName: 'admin' | 'member'
) {
  openMenuUserId.value = undefined
  busyUserIds.value.add(member.userId)
  errorMessage.value = ''
  try {
    await NetworkService.updateNTHSGroupMember(groupId.value, member.userId, {
      role: roleName,
    })
    patchMember(member.userId, { roleName })
    refreshAfterMembershipChange()
  } catch (err) {
    LoggerService.noticeError(err)
    errorMessage.value = `Something went wrong while updating ${member.firstName}'s role. Please refresh the page and try again.`
  } finally {
    busyUserIds.value.delete(member.userId)
  }
}

function removeMember(member: NTHSRosterMemberPublic) {
  openMenuUserId.value = undefined
  errorMessage.value = ''
  ModalService.showNthsUserManagementModal({
    isLoading: false,
    memberToRemove: {
      userId: member.userId,
      nthsGroupId: groupId.value,
      title: member.title ?? null,
      roleName: member.roleName,
      firstName: member.firstName,
      lastInitial: member.lastInitial,
    },
    onRemoved: () => {
      dropMember(member.userId)
      refreshAfterMembershipChange()
    },
    onCancel: () => {},
    isRemovingSelf: false,
  })
}
</script>

<template>
  <div class="members">
    <div class="page-header">
      <h1 class="page-title">Members</h1>
      <p v-if="rosterLoaded" class="page-subtitle" data-testid="roster-summary">
        {{ summary }}
      </p>
    </div>

    <p
      v-if="errorMessage"
      class="error"
      role="alert"
      data-testid="roster-error"
    >
      {{ errorMessage }}
    </p>

    <TopTutorCard
      v-if="rosterLoaded && topTutorThisMonth"
      :topTutor="topTutorThisMonth"
      :currentUserId="currentUserId"
    />

    <section
      v-if="rosterLoaded && members.length"
      class="activity"
      data-testid="member-activity"
    >
      <div class="activity-text">
        <p class="activity-eyebrow">Member activity</p>
        <p class="activity-headline" data-testid="member-activity-headline">
          {{ tutoredInPeriodCount }} of {{ activeMemberCount }}
          {{ plural(activeMemberCount, 'member') }}
          {{ activeMemberCount === 1 ? 'has' : 'have' }} tutored
          {{ ROSTER_PERIOD_PHRASES[activePeriod] }}.
        </p>
      </div>
      <div class="periods" role="group" aria-label="Period">
        <button
          v-for="period in ROSTER_PERIODS"
          :key="period"
          type="button"
          class="period"
          :class="{ active: period === activePeriod }"
          :aria-pressed="period === activePeriod"
          :data-testid="`roster-period-${period}`"
          @click="selectPeriod(period)"
        >
          {{ ROSTER_PERIOD_LABELS[period] }}
        </button>
      </div>
    </section>
    <p
      v-if="rosterLoaded && impactLoadFailed && members.length"
      class="notice"
      data-testid="impact-error"
    >
      We couldn't load this year's numbers. Refresh to try again.
    </p>

    <Loader v-if="isLoading" />
    <p v-else-if="loadFailed" class="notice" data-testid="roster-load-error">
      We couldn't load your members. Refresh the page to try again.
    </p>
    <template v-else>
      <p
        v-if="onlyViewerOnRoster"
        class="notice"
        data-testid="roster-invite-nudge"
      >
        No one else has joined yet. Share your invite link from Home.
      </p>
      <div class="roster-controls">
        <RosterFilterChips
          :modelValue="activeFilter"
          :counts="counts"
          :period="activePeriod"
          @update:modelValue="selectFilter"
        />
        <RosterSortControl v-if="isStacked" v-model="activeSort" />
      </div>

      <div ref="rosterAreaRef" class="roster-area">
        <p
          v-if="!visibleMembers.length"
          class="notice"
          data-testid="roster-empty"
        >
          No members match this filter.
        </p>
        <RosterCards
          v-else-if="isStacked"
          :members="visibleMembers"
          :now="now"
          :period="activePeriod"
          :currentUserId="currentUserId"
          :canManage="isGroupAdmin"
          :openMenuUserId="openMenuUserId"
          :busyUserIds="busyUserIds"
          :sort="activeSort"
          @sort="sortBy"
          @toggleMenu="toggleMenu"
          @closeMenu="closeMenu"
          @changeRole="changeRole"
          @remove="removeMember"
        />
        <RosterTable
          v-else
          :members="visibleMembers"
          :now="now"
          :period="activePeriod"
          :currentUserId="currentUserId"
          :canManage="isGroupAdmin"
          :openMenuUserId="openMenuUserId"
          :busyUserIds="busyUserIds"
          :sort="activeSort"
          @sort="sortBy"
          @toggleMenu="toggleMenu"
          @closeMenu="closeMenu"
          @changeRole="changeRole"
          @remove="removeMember"
        />
      </div>

      <div v-if="isGroupAdmin && visibleMembers.length" class="export">
        <LargeButton
          variant="secondary"
          :showArrow="false"
          data-testid="download-csv"
          @click="downloadCsv"
        >
          Download CSV
        </LargeButton>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.members {
  @include nths-tab-column(1060px);
}
.page-title {
  @include nths-page-title;
}
.page-subtitle {
  @include nths-page-subtitle;
}
.activity {
  @include nths-card(20px 24px);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}
.activity-text {
  flex: 1;
  min-width: 200px;
}
.periods {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.period {
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  line-height: 1.2;
  background: $upchieve-white;
  border: 1px solid $c-border-grey;
  color: $c-soft-black;
  white-space: nowrap;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }

  @include breakpoint-below('tiny') {
    padding: 8px 12px;
    font-size: 13px;
  }
}
.period.active {
  background: $c-nths-navy;
  border-color: $c-nths-navy;
  color: $upchieve-white;
  font-weight: 500;
}
.activity-eyebrow {
  @include nths-card-eyebrow;
  color: $c-nths-navy;
  margin: 0;
}
.activity-headline {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.35;
  margin: 6px 0 0;
}
.notice {
  @include nths-notice;
}
.error {
  @include nths-error-box;
  margin: 0;
}
.roster-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.export {
  display: flex;
  justify-content: flex-end;
}
</style>
