<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import ArrowIcon from '@/assets/arrow.svg'
import CheckIcon from '@/assets/check.svg'
import CheckCircledIcon from '@/assets/check-circled.svg'
import CollegeIcon from '@/assets/nths/benefit-college.svg'
import RecommendationLettersIcon from '@/assets/nths/benefit-recommendation-letters.svg'
import VolunteerHoursIcon from '@/assets/nths/benefit-volunteer-hours.svg'
import SpotlightIcon from '@/assets/nths/benefit-spotlight.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { NTHS_APPLY_URL } from '@/services/NTHSGroupService'
import {
  daysLeftToApply,
  type NTHSApplyPreview,
} from '@/services/NTHSApplicationService'
import { dayjs } from '@/utils/time-utils'

type RequirementKey = keyof NTHSApplyPreview['requirements']

const REQUIREMENTS: {
  key: RequirementKey
  label: string
  link?: { to: string; text: string }
}[] = [
  {
    key: 'training',
    label: 'Finish tutor training',
    link: { to: '/training', text: 'Go to training' },
  },
  {
    key: 'safetyReview',
    label: 'Finish your safety screening',
    link: { to: '/dashboard', text: 'Start your safety screening' },
  },
  {
    key: 'firstSession',
    label: 'Tutor one student',
    link: { to: '/dashboard', text: 'Help a student now' },
  },
]

const BENEFITS = [
  {
    key: 'college',
    icon: CollegeIcon,
    title: 'Stand out on college apps',
    body: 'Founding a chapter of a national movement is impressive.',
  },
  {
    key: 'recommendation-letters',
    icon: RecommendationLettersIcon,
    title: 'Recommendation letters',
    body: 'Earn letters from UPchieve staff who know your work.',
  },
  {
    key: 'volunteer-hours',
    icon: VolunteerHoursIcon,
    title: 'Volunteer hours',
    body: 'Tutoring and running your chapter both count as service hours.',
  },
  {
    key: 'spotlight',
    icon: SpotlightIcon,
    title: 'National recognition',
    body: 'Signed, nationally recognized certificates for members.',
  },
]

const store = useStore()

const preview = computed(
  () => store.state.nths.NTHSApplyPreview as NTHSApplyPreview | undefined
)
const requirements = computed(() => preview.value?.requirements)

const countdown = computed(() => {
  if (!preview.value) return
  const days = daysLeftToApply(preview.value.closesAt)
  if (days === 0) return 'Last day to apply'
  return `${days} ${days === 1 ? 'day' : 'days'} left to apply`
})

const closesOn = computed(
  () => preview.value && dayjs(preview.value.closesAt).format('MMM D, YYYY')
)

function showsLink(key: RequirementKey): boolean {
  const status = requirements.value
  if (!status) return false
  // Only a trained, approved coach can pick up a student.
  if (key === 'firstSession')
    return (
      status.firstSession === 'outstanding' &&
      status.training === 'done' &&
      status.safetyReview === 'done'
    )
  return status[key] === 'outstanding'
}

function onClickedLearnMore() {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLY_PREVIEW_CLICKED_LEARN_MORE)
}

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLY_PREVIEW_VIEWED, {
    requirements: requirements.value,
  })
})
</script>

<template>
  <div class="page" data-testid="nths-apply-preview">
    <div class="card">
      <p v-if="countdown" class="countdown">{{ countdown }}</p>
      <div class="heading">
        <img class="crest" src="@/assets/nths/nths-logo.svg?url" alt="" />
        <h1 class="title">National Tutoring Honor Society</h1>
      </div>
      <p class="body">
        The National Tutoring Honor Society (NTHS) is a student-led honor
        society powered by UPchieve. Get your friends tutoring, and you run the
        chapter.
      </p>
      <p v-if="closesOn" class="deadline">
        Applications close <strong>{{ closesOn }}</strong
        >.
      </p>
      <p class="no-approval">
        <check-circled-icon class="no-approval-check" aria-hidden="true" />
        No school approval required
      </p>

      <div class="benefits">
        <h2 class="eyebrow">Why start a chapter?</h2>
        <ul class="benefit-list">
          <li
            v-for="benefit in BENEFITS"
            :key="benefit.key"
            :class="['benefit', `benefit--${benefit.key}`]"
          >
            <component
              :is="benefit.icon"
              class="benefit-icon"
              aria-hidden="true"
            />
            <h3 class="benefit-title">{{ benefit.title }}</h3>
            <p class="benefit-body">{{ benefit.body }}</p>
          </li>
        </ul>
      </div>

      <div class="requirements">
        <h2 class="eyebrow">Before you can apply</h2>
        <ul class="requirement-list">
          <li
            v-for="requirement in REQUIREMENTS"
            :key="requirement.key"
            class="requirement"
          >
            <check-icon
              v-if="requirements?.[requirement.key] === 'done'"
              class="requirement-check"
              role="img"
              aria-label="Done"
              :data-testid="`apply-preview-done-${requirement.key}`"
            />
            <span v-else class="requirement-bullet" />
            <div class="requirement-body">
              <span class="requirement-label">{{ requirement.label }}</span>
              <router-link
                v-if="requirement.link && showsLink(requirement.key)"
                class="requirement-link"
                :to="requirement.link.to"
                :data-testid="`apply-preview-link-${requirement.key}`"
                >{{ requirement.link.text }} →</router-link
              >
            </div>
            <span
              v-if="requirements?.[requirement.key] === 'inReview'"
              class="requirement-tag"
              :data-testid="`apply-preview-in-review-${requirement.key}`"
              >In review</span
            >
          </li>
        </ul>
      </div>

      <a
        class="learn-more-link"
        :href="NTHS_APPLY_URL"
        target="_blank"
        rel="noopener noreferrer"
        @click="onClickedLearnMore"
        >Learn more about NTHS &amp; the president's role here
        <arrow-icon class="arrow-icon" aria-hidden="true" />
      </a>

      <div class="cta">
        <LargeButton
          variant="primary-blue"
          :show-arrow="false"
          disabled
          data-testid="apply-preview-cta"
          >Apply to become a president</LargeButton
        >
        <p class="cta-helper">
          You'll be able to apply once you've met the requirements above.
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  padding-top: 32px;
}
.card {
  width: 100%;
  background-color: $upchieve-white;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 32px;

  @include breakpoint-above('medium') {
    max-width: 600px;
  }
}
.countdown {
  @include font-category('caption');
  font-weight: $font-weight-bold;
  display: inline-block;
  background-color: color-mix(in oklab, $c-warning-orange, white 85%);
  color: color-mix(in oklab, $c-warning-orange, black 40%);
  border-radius: $radius-sm;
  padding: 5px 10px;
  margin: 0 0 14px;
}
.heading {
  display: flex;
  align-items: center;
  gap: 12px;
}
.crest {
  width: 44px;
  height: 44px;
  flex: none;
}
.title {
  @include font-category('display-small');
  margin: 0;
}
.body {
  @include font-category('body');
  color: $c-default-grey;
  margin-top: 16px;
}
.deadline {
  @include font-category('body');
  color: $c-default-grey;
  margin: 12px 0 0;
}
.no-approval {
  @include font-category('helper-text');
  display: flex;
  align-items: center;
  gap: 6px;
  color: color-mix(in oklab, $c-success-green, black 55%);
  background-color: color-mix(in oklab, $c-success-green, white 94%);
  border: 1px solid color-mix(in oklab, $c-success-green, white 75%);
  border-radius: $radius-lg;
  padding: 6px 12px;
  margin: 12px 0 0;
  width: fit-content;
}
.no-approval-check {
  width: 16px;
  height: 16px;
  flex: none;
}
.eyebrow {
  @include font-category('caption');
  font-weight: $font-weight-bold;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $c-secondary-grey;
  margin: 0;
}

// #fd76f4 and #8ec1ff have no close match in _colors.scss.
$benefit-accents: (
  'college': $c-warning-orange,
  'recommendation-letters': #fd76f4,
  'volunteer-hours': #8ec1ff,
  'spotlight': $c-success-green,
);

.benefits {
  border-top: 1px solid $c-border-grey;
  margin-top: 22px;
  padding-top: 22px;
}
.benefit-list {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin: 14px 0 0;
  padding: 0;

  @include breakpoint-above('medium') {
    grid-template-columns: repeat(2, 1fr);
  }
}
.benefit {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: $upchieve-white;
  border: 2px solid;
  border-radius: 12px;
  padding: 16px;
}
@each $key, $accent in $benefit-accents {
  .benefit--#{$key} {
    border-color: $accent;
    box-shadow: 4px 4px 0 $accent;
  }
}
.benefit-icon {
  width: 56px;
  height: 56px;
}
.benefit-title {
  @include font-category('subheading');
  font-weight: $font-weight-bold;
  margin: 8px 0 0;
}
.benefit-body {
  @include font-category('helper-text');
  color: $c-default-grey;
  margin: 4px 0 0;
}

.requirements {
  background-color: $c-background-grey;
  border-radius: 8px;
  padding: 20px 22px;
  margin-top: 22px;
}
.requirement-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 14px 0 0;
  padding: 0;
}
.requirement {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.requirement-bullet {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: $c-information-blue;
  flex: none;
  align-self: flex-start;
  margin-top: 10px;
}
.requirement-check {
  width: 14px;
  height: 14px;
  flex: none;
  align-self: flex-start;
  margin-top: 5px;
}
.requirement-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.requirement-label {
  @include font-category('body');
}
.requirement-link {
  @include font-category('helper-text');
  font-weight: $font-weight-medium;
  color: $c-information-blue;
  margin-top: 3px;
}
.requirement-tag {
  @include font-category('caption');
  color: $c-secondary-grey;
  background-color: $upchieve-white;
  border: 1px solid $c-border-grey;
  border-radius: 12px;
  padding: 2px 10px;
  flex: none;
  white-space: nowrap;
}

.learn-more-link {
  @include font-category('subheading');
  display: inline-block;
  color: $c-information-blue;
  margin-top: 14px;
}
.arrow-icon {
  fill: $c-information-blue;
  height: 16px;
  width: 16px;
  margin-left: 8px;
}
.cta {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-top: 24px;
}
.cta-helper {
  @include font-category('helper-text');
  color: $c-secondary-grey;
  text-align: center;
  margin-top: 10px;
}
</style>
