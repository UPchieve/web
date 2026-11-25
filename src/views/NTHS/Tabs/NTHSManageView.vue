<script setup lang="ts">
import { computed, onBeforeMount, ref, shallowRef, watch } from 'vue'
import ChapterSettings from '@/components/NTHS/HQ/ChapterSettings.vue'
import MembersTable from '@/components/NTHS/Members/MembersTable.vue'
import RosterRangePicker from '@/components/NTHS/Members/RosterRangePicker.vue'
import { useChapterContext } from '@/composables/useChapterContext'
import { useChapterRoster } from '@/composables/useChapterRoster'
import { useRosterPreferences } from '@/composables/useRosterPreferences'
import LoggerService from '@/services/LoggerService'
import ModalService from '@/services/ModalService'
import NetworkService from '@/services/NetworkService'
import {
  LEADERSHIP_TITLES,
  type NTHSMemberUpdate,
  type NTHSRosterMemberPublic,
  type NTHSTitle,
} from '@/services/NTHSGroupService'
import {
  displayTitle,
  memberDisplayName,
  periodRange,
  rangeBounds,
  titleChoices,
  type RosterMemberAction,
  type RosterPeriod,
  type RosterRange,
} from '@/services/NTHSRosterService'
import { useNthsStore } from '@/stores/nths'
import { dayjs } from '@/utils/time-utils'

const nths = useNthsStore()
const { group, groupId, currentUserId, referralCode, leaveChapter } =
  useChapterContext()

const {
  members,
  schoolYear,
  isLoading,
  isReloading,
  loadFailed,
  load,
  refresh: refreshRoster,
  patchMember,
  dropMember,
} = useChapterRoster()

const now = new Date()
const today = dayjs(now).startOf('day').toDate()
const foundedOn = computed(() =>
  dayjs(group.value?.groupInfo?.createdAt).startOf('day').toDate()
)

const { period, sort } = useRosterPreferences(currentUserId.value)
const pickedDays = shallowRef<RosterRange>()
const busyUserIds = ref(new Set<string>())
const errorMessage = ref('')

// This school year's first day comes from the roster, so that quick pick has
// no range until the first load returns.
const range = computed<RosterRange | undefined>(() => {
  if (!period.value) return pickedDays.value
  if (period.value === 'thisSchoolYear' && !schoolYear.value) return undefined
  const schoolYearStartsOn = new Date(schoolYear.value?.startsAt ?? now)
  return periodRange(period.value, now, foundedOn.value, schoolYearStartsOn)
})
const bounds = computed(() => range.value && rangeBounds(range.value))

// Stays true through the second load, so the table never renders the first
// response's zero counts under a range.
const settling = ref(true)

onBeforeMount(async () => {
  if (!groupId.value) {
    settling.value = false
    return
  }
  const waitsForSchoolYear = !range.value
  await load(groupId.value, now, bounds.value)
  if (waitsForSchoolYear && !loadFailed.value) {
    await load(groupId.value, now, bounds.value)
  }
  settling.value = false
})

function refreshInRange() {
  if (!groupId.value) return
  void refreshRoster(groupId.value, now, bounds.value)
}

// Keyed by value: each roster response recomputes the range with equal dates.
watch(
  () =>
    bounds.value &&
    `${bounds.value.startsAt.toISOString()}/${bounds.value.endsAt.toISOString()}`,
  (key, oldKey) => {
    if (key && oldKey && groupId.value) {
      void load(groupId.value, now, bounds.value)
    }
  }
)

watch(() => group.value?.renewal?.prompt, refreshInRange)

function pickPeriod(picked: RosterPeriod) {
  period.value = picked
}

function pickDays(firstDay: Date, lastDay: Date) {
  pickedDays.value = { firstDay, lastDay }
  period.value = undefined
}

async function updateMember(
  member: NTHSRosterMemberPublic,
  update: NTHSMemberUpdate,
  patch: Partial<NTHSRosterMemberPublic>,
  failureMessage: string
) {
  busyUserIds.value.add(member.userId)
  errorMessage.value = ''
  try {
    await NetworkService.updateNTHSGroupMember(
      groupId.value,
      member.userId,
      update
    )
    patchMember(member.userId, patch)
    refreshInRange()
    if (member.userId === currentUserId.value) {
      nths
        .refreshNTHSGroups()
        .catch((err) =>
          LoggerService.noticeError(err, 'Could not refresh NTHS groups')
        )
    }
  } catch (err) {
    LoggerService.noticeError(err)
    errorMessage.value = failureMessage
  } finally {
    busyUserIds.value.delete(member.userId)
  }
}

function roleFailureMessage(member: NTHSRosterMemberPublic) {
  return `Something went wrong while updating ${member.firstName}'s role. Please refresh the page and try again.`
}

async function makeAdmin(member: NTHSRosterMemberPublic) {
  const title = await ModalService.showNthsMemberTitleModal({
    heading: `Make ${memberDisplayName(member)} an admin`,
    choices: titleChoices(member, members.value, true),
    current: member.title,
    acceptText: 'Make admin',
  })
  if (!title) return
  await updateMember(
    member,
    { role: 'admin', title },
    { roleName: 'admin', title },
    roleFailureMessage(member)
  )
}

async function changeTitle(member: NTHSRosterMemberPublic) {
  const title = await ModalService.showNthsMemberTitleModal({
    heading: `Change ${memberDisplayName(member)}'s title`,
    choices: titleChoices(member, members.value, member.roleName === 'admin'),
    current: member.title,
    acceptText: 'Save',
  })
  if (!title || title === member.title) return
  await updateMember(
    member,
    { title },
    { title },
    `Something went wrong while updating ${member.firstName}'s title. Please refresh the page and try again.`
  )
}

async function removeAdmin(member: NTHSRosterMemberPublic) {
  const losesTitle = LEADERSHIP_TITLES.includes(member.title)
  if (losesTitle) {
    const confirmed = await ModalService.showConfirm(
      `Remove ${memberDisplayName(member)} as admin?`,
      `They'll lose their ${displayTitle(member, members.value) ?? member.title} title, since only admins can hold it.`,
      { acceptText: 'Remove admin', backText: 'Cancel' }
    )
    if (!confirmed) return
  }
  const title: NTHSTitle = losesTitle ? 'Member' : member.title
  await updateMember(
    member,
    { role: 'member' },
    { roleName: 'member', title },
    roleFailureMessage(member)
  )
}

function onMemberAction(
  member: NTHSRosterMemberPublic,
  action: RosterMemberAction
) {
  switch (action) {
    case 'make_admin':
      return makeAdmin(member)
    case 'change_title':
      return changeTitle(member)
    case 'remove_admin':
      return removeAdmin(member)
    case 'remove':
      return removeMember(member)
    case 'leave':
      return leaveChapter()
  }
}

function removeMember(member: NTHSRosterMemberPublic) {
  errorMessage.value = ''
  ModalService.showNthsUserManagementModal({
    isLoading: false,
    memberToRemove: {
      userId: member.userId,
      nthsGroupId: groupId.value,
      title: member.title,
      roleName: member.roleName,
      firstName: member.firstName,
      lastInitial: member.lastInitial,
    },
    onRemoved: () => {
      dropMember(member.userId)
      refreshInRange()
    },
    onCancel: () => {},
    isRemovingSelf: false,
  })
}
</script>

<template>
  <div class="manage">
    <h1 class="page-title">Members</h1>

    <p
      v-if="errorMessage"
      class="error"
      role="alert"
      data-testid="roster-error"
    >
      {{ errorMessage }}
    </p>

    <MembersTable
      v-model:sort="sort"
      :members="members"
      :currentUserId="currentUserId"
      :isGroupAdmin="nths.hasAdminRole"
      :inviteCode="group?.groupInfo?.inviteCode"
      :referralCode="referralCode"
      :now="now"
      :isLoading="isLoading || settling"
      :isReloading="isReloading"
      :loadFailed="loadFailed"
      :schoolYearLabel="schoolYear?.label ?? ''"
      :range="range"
      :busyUserIds="busyUserIds"
      @act="onMemberAction"
    >
      <template #range>
        <RosterRangePicker
          v-if="range"
          :range="range"
          :earliestDay="foundedOn"
          :latestDay="today"
          @pickPeriod="pickPeriod"
          @pickDays="pickDays"
        />
      </template>
    </MembersTable>

    <ChapterSettings @leave="leaveChapter" />
  </div>
</template>

<style scoped lang="scss">
.manage {
  @include nths-tab-column(1060px);
}
.page-title {
  @include nths-page-title;
}
.error {
  @include nths-error-box;
  margin: 0;
}
</style>
