<script lang="ts" setup>
import {
  SchoolAffiliationMachine,
  type AdvisorInfo,
  type SchoolAffiliationEvent,
} from './SchoolAffiliation/school-affiliation-machine'
import type { AffiliationStatus } from '@/services/NTHSGroupService'
import SchoolForm from './SchoolAffiliation/Form.vue'
import { useMachine } from '@xstate/vue'
import LargeButton from '@/components/LargeButton.vue'
import Spinner from '@/components/Spinner.vue'
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

const isAddingAdvisorInfo = computed(
  () =>
    snapshot.value.matches('AddingAdvisorInfo') ||
    snapshot.value.matches('SubmittingAdvisorInfo')
)

const isSchoolCurrent = computed(
  () =>
    snapshot.value.matches('AwaitingAdvisorDetails') ||
    snapshot.value.matches('AwaitingUPchieveVerification') ||
    snapshot.value.matches('Approved')
)

const showCards = computed(
  () =>
    isSchoolCurrent.value ||
    snapshot.value.matches('Undecided') ||
    snapshot.value.matches('OptedOut') ||
    snapshot.value.matches('Denied')
)

const uid = useId()

type PathButton = {
  label: string
  variant: string
  testid: string
  event: SchoolAffiliationEvent
}

const TRY_SCHOOL_APPROVAL: PathButton = {
  label: 'Try for school approval',
  variant: 'secondary',
  testid: 'choose-school-approved-button',
  event: { type: 'OPT_IN' },
}
const ADD_ADVISOR: PathButton = {
  label: 'Add advisor',
  variant: 'primary-blue',
  testid: 'add-advisor-button',
  event: { type: 'ADD_ADVISOR' },
}
const SWITCH_TO_COMMUNITY: PathButton = {
  label: 'Switch to community chapter',
  variant: 'secondary',
  testid: 'switch-to-community-button',
  event: { type: 'OPT_OUT' },
}

const schoolApprovedButton = computed(() => {
  if (snapshot.value.matches('AwaitingAdvisorDetails')) return ADD_ADVISOR
  if (isSchoolCurrent.value) return undefined
  return TRY_SCHOOL_APPROVAL
})

const communityButton = computed(() =>
  snapshot.value.matches('AwaitingAdvisorDetails')
    ? SWITCH_TO_COMMUNITY
    : undefined
)

type ChapterPath = {
  type: 'school_approved' | 'community'
  testid: string
  badgeTestid: string
  titleId: string
  badgeId: string
  title: string
  body: string
  bullets: string[]
  isCurrent: boolean
  button?: PathButton
}

const paths = computed<ChapterPath[]>(() => [
  {
    type: 'school_approved',
    testid: 'school-approved-path',
    badgeTestid: 'school-approved-current-badge',
    titleId: `${uid}-school-approved-title`,
    badgeId: `${uid}-school-approved-badge`,
    title: 'School-approved',
    body: "A teacher or staff member is your advisor. You follow your school's club rules, and get some perks:",
    bullets: [
      "Use your school's name and meet on campus",
      'Advisor approves events and space (tutoring stays on UPchieve)',
      'We email your advisor helpful information',
    ],
    isCurrent: isSchoolCurrent.value,
    button: schoolApprovedButton.value,
  },
  {
    type: 'community',
    testid: 'community-path',
    badgeTestid: 'community-current-badge',
    titleId: `${uid}-community-title`,
    badgeId: `${uid}-community-badge`,
    title: 'Community chapter',
    body: 'Friends, teammates, or classmates who meet outside school.',
    bullets: [
      'No school sign-off or adult needed',
      'Name your chapter, or keep the default name',
      'Meet online or in person, with people you know',
    ],
    isCurrent: !isSchoolCurrent.value,
    button: communityButton.value,
  },
])
</script>

<template>
  <div class="affiliation">
    <Spinner v-if="snapshot.hasTag('loading')" />

    <p
      v-if="snapshot.context.submitError && !isAddingAdvisorInfo"
      class="card-text error-text"
      data-testid="status-error"
    >
      {{ snapshot.context.submitError }}
    </p>

    <div class="paths" v-if="showCards">
      <section
        v-for="path in paths"
        :key="path.testid"
        class="card path"
        role="group"
        :aria-labelledby="
          path.isCurrent ? `${path.titleId} ${path.badgeId}` : path.titleId
        "
        :data-testid="path.testid"
      >
        <div class="path-heading">
          <h3 class="header" :id="path.titleId">{{ path.title }}</h3>
          <span
            v-if="path.isCurrent"
            class="badge"
            :id="path.badgeId"
            :data-testid="path.badgeTestid"
            >Current</span
          >
        </div>
        <p class="card-text">{{ path.body }}</p>
        <ul class="card-text">
          <li v-for="bullet in path.bullets" :key="bullet">{{ bullet }}</li>
        </ul>

        <div
          v-if="path.type === 'school_approved' && snapshot.matches('Approved')"
          class="status"
          data-testid="approved-panel"
        >
          <div class="status-header">🎉 Approved</div>
          Your chapter is officially affiliated with your school.
        </div>
        <div
          v-if="
            path.type === 'school_approved' &&
            snapshot.matches('AwaitingUPchieveVerification')
          "
          class="status"
          data-testid="awaiting-verification-panel"
        >
          <div class="status-header">✓ Submitted for Approval</div>
          Your chapter's school affiliation request has been sent to your school
          administrators for verification. We will update your approval status
          here.
        </div>

        <div class="path-footer" v-if="path.button">
          <LargeButton
            :variant="path.button.variant"
            :showArrow="false"
            :data-testid="path.button.testid"
            v-ph:nthshq="`setup.chapter_type.${path.type}`"
            @click="send(path.button.event)"
          >
            {{ path.button.label }}
          </LargeButton>
        </div>
      </section>
    </div>

    <section v-if="isAddingAdvisorInfo" class="card advisor">
      <div>
        <h3 class="header">Chapter Advisor</h3>
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
    </section>
  </div>
</template>

<style lang="scss" scoped>
.affiliation {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  @include nths-section-card;
}
.form {
  max-width: 480px;
}
.card-text {
  text-align: left;
  margin: 0;
}
.error-text {
  color: $c-error-red;
}
.header {
  @include nths-card-title;
  margin: 0;
  text-align: left;
}
.paths {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr);
  }
}
.path {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.path-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.path-footer {
  margin-top: auto;
  padding-top: 6px;
  display: flex;
  flex-direction: column;
}
.badge {
  @include nths-badge;
  border-radius: 9999px;
  background: $c-information-blue;
  color: $upchieve-white;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.status {
  border-radius: 8px;
  background-color: $c-nths-sky;
  padding: 12px 14px;
  text-align: left;
}
.status-header {
  font-weight: 500;
}
ul {
  margin: 0;
  padding-left: 18px;
}
li + li {
  margin-top: 6px;
}
</style>
