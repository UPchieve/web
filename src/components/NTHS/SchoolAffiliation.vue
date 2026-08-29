<script lang="ts" setup>
import {
  SchoolAffiliationMachine,
  type AdvisorInfo,
  type SchoolAffiliationEvent,
} from './SchoolAffiliation/school-affiliation-machine'
import type { AffiliationStatus } from '@/services/NTHSGroupService'
import SchoolForm from './SchoolAffiliation/Form.vue'
import { useMachine } from '@xstate/vue'
import LargeButton from '../LargeButton.vue'
import Spinner from '../Spinner.vue'
import Card from './Card.vue'
import { computed, useId } from 'vue'

const props = defineProps<{
  groupId: string
  initialStatus: AffiliationStatus | null
  hasSchoolOnRecord: boolean
}>()

const { snapshot, send } = useMachine(SchoolAffiliationMachine, {
  input: {
    groupId: props.groupId,
    schoolAffiliationStatus: props.initialStatus,
  },
})

const isSeekingSchoolApproval = computed(() =>
  snapshot.value.matches('AwaitingAdvisorDetails')
)

const isAddingAdvisorInfo = computed(
  () =>
    snapshot.value.matches('AddingAdvisorInfo') ||
    snapshot.value.matches('SubmittingAdvisorInfo')
)

const isChoosingPath = computed(
  () =>
    snapshot.value.matches('Undecided') ||
    snapshot.value.matches('OptedOut') ||
    isSeekingSchoolApproval.value
)

const CHOOSER_HEADER = 'Choose Your Chapter Type'
const AFFILIATION_HEADER = 'School Affiliation: Optional'

const opensOnAffiliationHeader: Record<AffiliationStatus, boolean> = {
  PENDING_SCHOOL_AFFILIATION: false,
  PENDING_UPCHIEVE_VERIFICATION: true,
  AFFILIATED: true,
  DENIED: true,
  OPTED_OUT: false,
  UNAFFILIATED: false,
}

const cardHeader = computed(() => {
  // The machine boots into Initial and only leaves it once setInitialState's
  // actor resolves, but schoolAffiliationStatus was already seeded into
  // context from props, so we can read the eventual panel straight off it
  // instead of waiting for the transition.
  if (snapshot.value.matches('Initial')) {
    const status = snapshot.value.context.schoolAffiliationStatus
    return status && opensOnAffiliationHeader[status]
      ? AFFILIATION_HEADER
      : CHOOSER_HEADER
  }
  return isChoosingPath.value || snapshot.value.matches('OptingOut')
    ? CHOOSER_HEADER
    : AFFILIATION_HEADER
})

const uid = useId()
const schoolPathTitleId = `${uid}-school-approved-title`
const schoolPathBadgeId = `${uid}-school-approved-badge`
const communityPathTitleId = `${uid}-community-title`
const communityPathBadgeId = `${uid}-community-badge`

type PathButton = {
  label: string
  variant: string
  testid: string
  event: SchoolAffiliationEvent
}

const CHOOSE_SCHOOL_APPROVED: PathButton = {
  label: 'Choose school-approved',
  variant: 'primary-blue',
  testid: 'choose-school-approved-button',
  event: { type: 'OPT_IN' },
}
const ADD_ADVISOR: PathButton = {
  label: 'Add your advisor',
  variant: 'primary-blue',
  testid: 'add-advisor-button',
  event: { type: 'ADD_ADVISOR' },
}
const STAY_COMMUNITY: PathButton = {
  label: 'Stay a community chapter',
  variant: 'outlined',
  testid: 'stay-community-button',
  event: { type: 'OPT_OUT' },
}
const SWITCH_TO_COMMUNITY: PathButton = {
  label: 'Switch to community chapter',
  variant: 'outlined',
  testid: 'switch-to-community-button',
  event: { type: 'OPT_OUT' },
}

const communityButton = computed(() => {
  if (isSeekingSchoolApproval.value) return SWITCH_TO_COMMUNITY
  // An opted-out chapter is already where this button would put it.
  if (snapshot.value.matches('Undecided')) return STAY_COMMUNITY
  return undefined
})

const paths = computed(() => [
  {
    testid: 'school-approved-path',
    badgeTestid: 'school-approved-current-badge',
    titleId: schoolPathTitleId,
    badgeId: schoolPathBadgeId,
    title: 'School-approved',
    body: "A teacher or school staff member is a formal advisor. You follow your school's requirement for starting school clubs.",
    bullets: [
      "Use your school's name, meet in a school room, table at the club fair",
      'Your advisor signs off on facilities and events (not tutoring, that still happens on UPchieve)',
      'We email your advisor for you and support you through school approval',
    ],
    isCurrent: isSeekingSchoolApproval.value,
    button: isSeekingSchoolApproval.value
      ? ADD_ADVISOR
      : CHOOSE_SCHOOL_APPROVED,
  },
  {
    testid: 'community-path',
    badgeTestid: 'community-current-badge',
    titleId: communityPathTitleId,
    badgeId: communityPathBadgeId,
    title: 'Community chapter',
    body: 'Community chapters are a group of friends, teammates, or peers from school who meet outside the school building.',
    bullets: [
      'No school sign-off, no adult required',
      'Name your chapter, or leave it numbered',
      'Meet online or in person, but members must be people you know in real life',
    ],
    isCurrent: !isSeekingSchoolApproval.value,
    button: communityButton.value,
  },
])
</script>

<template>
  <Card class="card">
    <template v-slot:header>{{ cardHeader }}</template>
    <Spinner class="spinner" v-if="snapshot.hasTag('loading')" />

    <p
      v-if="snapshot.context.submitError && !isAddingAdvisorInfo"
      class="card-text error-text"
      data-testid="status-error"
    >
      {{ snapshot.context.submitError }}
    </p>

    <div class="chooser" v-if="isChoosingPath">
      <p class="card-text">
        There are two types of official NTHS chapters: school-approved and
        community. Getting your school to officially approve NTHS as a club is a
        bonus, it unlocks meeting space and school announcements, but it isn't
        required to run a chapter. You can switch your chapter type anytime in
        the first year. Chapters often start as a community chapter while they
        wait for school approval.
      </p>

      <div class="paths">
        <div
          v-for="path in paths"
          :key="path.testid"
          class="path"
          :class="{ 'path-current': path.isCurrent }"
          role="group"
          :aria-labelledby="
            path.isCurrent ? `${path.titleId} ${path.badgeId}` : path.titleId
          "
          :data-testid="path.testid"
        >
          <div class="path-heading">
            <div class="header" :id="path.titleId">{{ path.title }}</div>
            <span
              v-if="path.isCurrent"
              class="badge"
              :id="path.badgeId"
              :data-testid="path.badgeTestid"
              >CURRENT</span
            >
          </div>
          <p class="card-text">{{ path.body }}</p>
          <ul class="card-text">
            <li v-for="bullet in path.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
          <div class="path-footer" v-if="path.button">
            <LargeButton
              :variant="path.button.variant"
              :showArrow="false"
              :data-testid="path.button.testid"
              @click="send(path.button.event)"
            >
              {{ path.button.label }}
            </LargeButton>
          </div>
        </div>
      </div>
    </div>
    <div class="max-width" v-if="isAddingAdvisorInfo">
      <div>
        <div class="header">Chapter Advisor</div>
        <p class="card-text" v-if="hasSchoolOnRecord">
          Add a faculty advisor who can verify your chapter's affiliation.
        </p>
        <p class="card-text" v-else>
          Add your school and a faculty advisor who can verify your chapter's
          affiliation.
        </p>
        <p v-if="snapshot.context.submitError" class="card-text error-text">
          {{ snapshot.context.submitError }}
        </p>
      </div>
      <SchoolForm
        class="form"
        @submit="
          (advisorInfo: AdvisorInfo) =>
            send({ type: 'SUBMIT_ADVISOR_INFO', advisorInfo })
        "
        @cancel="() => send({ type: 'WITHDRAW' })"
        :submitting="snapshot.matches('SubmittingAdvisorInfo')"
        :schoolAlreadyKnown="hasSchoolOnRecord"
      />
    </div>

    <div
      class="max-width status"
      v-if="snapshot.matches('Denied')"
      data-testid="denied-panel"
    >
      <div class="body">
        <div class="header">Denied</div>
        Your school has denied the affiliation request. You can try again with a
        different school or contact the school administrators.
      </div>
      <div class="footer">
        <LargeButton
          variant="primary-blue"
          :showArrow="false"
          @click="send({ type: 'OPT_IN' })"
        >
          Try again
        </LargeButton>
      </div>
    </div>

    <div
      class="max-width status"
      v-if="snapshot.matches('Approved')"
      data-testid="approved-panel"
    >
      <div class="body">
        <div class="header">🎉 Approved</div>
        Your chapter is officially affiliated with your school.
      </div>
    </div>

    <div
      class="max-width status"
      v-if="snapshot.matches('AwaitingUPchieveVerification')"
      data-testid="awaiting-verification-panel"
    >
      <div class="body">
        <div class="header">✓ Submitted for Approval</div>
        Your chapter's school affiliation request has been sent to your school
        administrators for verification. We will update your approval status
        here.
      </div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.card {
  width: fit-content;
  height: fit-content;
}
.form {
  min-width: 400px;
}
.spinner {
  min-width: 400px;
}
.card-text {
  text-align: left;
}
.error-text {
  color: $c-error-red;
}
.header {
  text-align: left;
  font-weight: 500;
}
.body {
  border-radius: 8px;
  background-color: $border-grey;
  border: 1px solid rgb(184, 184, 184);

  padding: 1em;
  text-align: left;
}
.footer {
  padding-top: 1em;
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 12px;
}
.max-width {
  max-width: 400px;
}
.chooser {
  max-width: 720px;
}
.paths {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 16px;
  padding-top: 0.5em;
}
.path {
  flex: 1 1 280px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid $border-grey;
  padding: 1em;
  text-align: left;
}
.path-current {
  border-color: $c-success-green;
  background-color: $selected-green;
}
.path-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.path-footer {
  margin-top: auto;
  padding-top: 1em;
}
.badge {
  background-color: $c-success-green;
  color: $c-soft-black;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.04em;
}

ul {
  padding-left: 16px;
}
</style>
