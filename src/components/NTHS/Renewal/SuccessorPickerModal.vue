<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import { useAppModalStore } from '@/stores/app/modal'
import LargeButton from '@/components/LargeButton.vue'
import RosterMemberIdentity from '@/components/NTHS/Members/RosterMemberIdentity.vue'
import AcceptPresidency from '@/components/NTHS/Renewal/AcceptPresidency.vue'
import { useChapterRoster } from '@/composables/useChapterRoster'
import { useRenewalNaming } from '@/composables/useRenewalNaming'
import LoggerService from '@/services/LoggerService'
import {
  hoursLabel,
  memberDisplayName,
  rosterStatus,
} from '@/services/NTHSRosterService'
import {
  namedSuccessors,
  renewalSchoolYear,
  successorNamerLabel,
  successorPickerHint,
  whoWillLeadTitle,
} from '@/services/NTHSRenewalService'
import type { RenewalNamingResult } from '@/composables/useRenewalNaming'
import type {
  NTHSRenewalCommitments,
  NTHSRenewalSuccessorPublic,
  NTHSRenewalSuccessorsResponse,
  NTHSRosterMemberPublic,
} from '@/services/NTHSGroupService'
import { plural } from '@/utils/plural'

export type SuccessorPickerModalProps = {
  groupId: string
  // Opened by Chapter HQ on its own, so dismissing it puts the ask off.
  asReminder: boolean
}

const SEARCH_ABOVE_MEMBER_COUNT = 8

const props = defineProps<SuccessorPickerModalProps>()
const store = useStore()
const modalStore = useAppModalStore()
const {
  currentMembers,
  load: loadRoster,
  loadFailed: rosterFailed,
} = useChapterRoster()
const { renewal, chapterName, isSubmitting, errorMessage, submit, nameSelf } =
  useRenewalNaming(
    () => props.groupId,
    () => {
      isAskingCommitments.value = true
      return new Promise((resolve) => {
        resolveCommitments = resolve
      })
    }
  )

const viewerId = computed<string>(() => store.state.user.user.id)
const successors = computed<NTHSRenewalSuccessorPublic[]>(
  () => store.state.nths.NTHSRenewalSuccessors[props.groupId] ?? []
)
const canEdit = ref(false)
const expectedUserIds = ref<string[]>([])
const isLoading = ref(true)
const loadFailed = ref(false)
const selected = ref<string[]>([])
const query = ref('')
let resolveCommitments:
  | ((commitments: NTHSRenewalCommitments | undefined) => void)
  | undefined
const isAskingCommitments = ref(false)

const named = computed(() => namedSuccessors(successors.value))
const namedIds = computed(() => named.value.map(({ userId }) => userId))
const steppedDownIds = computed(
  () =>
    new Set(
      successors.value
        .filter(({ accepted }) => accepted === false)
        .map(({ userId }) => userId)
    )
)

function applySuccessors(response: NTHSRenewalSuccessorsResponse) {
  canEdit.value = response.canEditSuccessors
  expectedUserIds.value = [...namedIds.value]
  selected.value = [...expectedUserIds.value]
}

async function loadSuccessors() {
  applySuccessors(
    await store.dispatch('nths/fetchNTHSRenewalSuccessors', props.groupId)
  )
}

onBeforeMount(async () => {
  try {
    await Promise.all([loadSuccessors(), loadRoster(props.groupId, new Date())])
  } catch (err) {
    loadFailed.value = true
    LoggerService.noticeError(err, 'Could not load NTHS renewal successors')
  } finally {
    isLoading.value = false
  }
})

const title = computed(() =>
  namedIds.value.length
    ? "Next year's president"
    : whoWillLeadTitle(chapterName.value)
)
const body = computed(() => {
  if (!renewal.value || isLoading.value || loadFailed.value) return ''
  if (!canEdit.value || renewal.value.prompt === 'none') return ''
  const hint = successorPickerHint(renewal.value)
  return namedIds.value.length
    ? hint
    : `Nobody has been named as next year's president yet. ${hint}`
})

function sortGroup(member: NTHSRosterMemberPublic): number {
  if (namedIds.value.includes(member.userId)) return 0
  return member.roleName === 'admin' ? 1 : 2
}

const rows = computed(() =>
  [...currentMembers.value]
    .sort(
      (a, b) =>
        sortGroup(a) - sortGroup(b) ||
        b.periodHours.allTime - a.periodHours.allTime ||
        memberDisplayName(a).localeCompare(memberDisplayName(b))
    )
    .map((member) => {
      const steppedDown = steppedDownIds.value.has(member.userId)
      const hours = hoursLabel(member.periodHours.allTime)
      const detail = [`${hours} ${plural(hours, 'hour')} total`]
      if (rosterStatus(member) !== 'ready-to-tutor') {
        detail.push("Hasn't finished onboarding")
      }
      const namedSuccessor = named.value.find(
        ({ userId }) => userId === member.userId
      )
      const namer =
        namedSuccessor && successorNamerLabel(namedSuccessor, viewerId.value)
      if (namer) {
        detail.push(`Named by ${namer}`)
      }
      return {
        member,
        name: memberDisplayName(member),
        detail: detail.join(' · '),
        steppedDown,
        isSelected: selected.value.includes(member.userId),
      }
    })
)

const showSearch = computed(
  () => currentMembers.value.length > SEARCH_ABOVE_MEMBER_COUNT
)
const visibleRows = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return rows.value
  return rows.value.filter(({ name }) => name.toLowerCase().includes(term))
})

const hasChanges = computed(
  () =>
    selected.value.length !== expectedUserIds.value.length ||
    selected.value.some((userId) => !expectedUserIds.value.includes(userId))
)

function toggle(userId: string) {
  selected.value = selected.value.includes(userId)
    ? selected.value.filter((id) => id !== userId)
    : [...selected.value, userId]
}

function answerCommitments(commitments: NTHSRenewalCommitments | undefined) {
  isAskingCommitments.value = false
  resolveCommitments?.(commitments)
  resolveCommitments = undefined
}

async function handleWrite(write: () => Promise<RenewalNamingResult>) {
  const result = await write()
  if (result === 'saved') {
    modalStore.hide()
  } else if (result === 'failed') {
    try {
      await loadSuccessors()
    } catch (err) {
      LoggerService.noticeError(err, 'Could not reload NTHS successors')
    }
  }
}

function save() {
  const expected = [...expectedUserIds.value]
  const userIds = [...selected.value]
  return handleWrite(() =>
    submit({
      namesCaller:
        userIds.includes(viewerId.value) && !expected.includes(viewerId.value),
      send: (commitments) =>
        store.dispatch('nths/saveNTHSRenewalSuccessors', {
          groupId: props.groupId,
          update: { userIds, expectedUserIds: expected, commitments },
        }),
    })
  )
}

function onNameSelf() {
  return handleWrite(() => nameSelf())
}

function onCancel() {
  if (isAskingCommitments.value) {
    answerCommitments(undefined)
  }
  modalStore.hide()
}

defineExpose({ onCancel })
</script>

<template>
  <div class="successor-picker">
    <AcceptPresidency
      v-if="isAskingCommitments && renewal"
      :chapterName="chapterName"
      :schoolYear="renewalSchoolYear(renewal.closesOn)"
      @accept="answerCommitments"
      @cancel="answerCommitments(undefined)"
    />
    <template v-else>
      <div class="heading">
        <h2 class="title">{{ title }}</h2>
        <p v-if="body" class="body">{{ body }}</p>
        <div
          v-if="errorMessage"
          class="error-container"
          role="alert"
          data-testid="successor-picker-error"
        >
          {{ errorMessage }}
        </div>
        <LargeButton
          v-if="renewal?.canNameSelf && !asReminder"
          class="me-button"
          :showArrow="false"
          variant="secondary"
          data-testid="successor-picker-me"
          :disabled="isSubmitting || isLoading || loadFailed || hasChanges"
          @click="onNameSelf"
          >Me</LargeButton
        >
        <div v-if="showSearch" class="search">
          <label for="successor-picker-search">Search members</label>
          <input
            id="successor-picker-search"
            v-model="query"
            type="search"
            placeholder="Name"
            autocomplete="off"
          />
        </div>
      </div>

      <p v-if="loadFailed || rosterFailed" class="body" role="alert">
        Something went wrong while loading your chapter's members. Please
        refresh the page and try again.
      </p>
      <ul v-else-if="!isLoading" class="rows">
        <li
          v-for="row in visibleRows"
          :key="row.member.userId"
          class="row"
          :class="{ 'stepped-down': row.steppedDown }"
          data-testid="successor-picker-row"
        >
          <RosterMemberIdentity
            :member="row.member"
            :roster="currentMembers"
            :detail="row.detail"
          />
          <LargeButton
            class="select-button"
            :showArrow="false"
            :variant="row.isSelected ? 'primary-blue' : 'secondary'"
            :aria-pressed="row.steppedDown ? undefined : row.isSelected"
            :disabled="row.steppedDown || !canEdit || isSubmitting"
            @click="toggle(row.member.userId)"
            >{{
              row.steppedDown
                ? 'Stepped down'
                : row.isSelected
                  ? 'Selected'
                  : 'Select'
            }}</LargeButton
          >
        </li>
        <li v-if="!visibleRows.length && query" class="no-match">
          No members match "{{ query }}".
        </li>
      </ul>

      <div class="actions">
        <LargeButton
          v-if="renewal?.canNameSelf && asReminder"
          :showArrow="false"
          variant="secondary"
          data-testid="successor-picker-me"
          :disabled="isSubmitting || isLoading || loadFailed || hasChanges"
          @click="onNameSelf"
          >Me</LargeButton
        >
        <LargeButton
          :showArrow="false"
          variant="secondary"
          data-testid="successor-picker-dismiss"
          :disabled="isSubmitting"
          @click="onCancel"
          >{{ asReminder ? 'Remind me later' : 'Cancel' }}</LargeButton
        >
        <LargeButton
          :showArrow="false"
          variant="primary-blue"
          data-testid="successor-picker-save"
          :disabled="!hasChanges || isSubmitting"
          @click="save"
          >Save</LargeButton
        >
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.successor-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 220px);
  text-align: left;
}
.heading {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: none;
}
.title {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
}
.body {
  @include nths-page-subtitle;
  margin: 0;
}
.error-container {
  @include nths-error-box;
}
.me-button {
  align-self: flex-start;
}
.search {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 13px;
    color: $c-secondary-grey;
    margin: 0;
  }
  input {
    border: 1px solid $c-border-grey;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 15px;
  }
}
.rows {
  flex: 1 1 auto;
  min-height: 120px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  @include nths-card(10px 14px);
}
.row.stepped-down {
  opacity: 0.55;
}
.row :deep(.member-text) {
  flex: 1;
}
.select-button {
  flex: none;
  min-width: 110px;
}
.no-match {
  @include nths-page-subtitle;
}
.actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  flex: none;
}
</style>
