<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import TutorIcon from '@/assets/icons/graduation_cap_icon.svg'
import BookIcon from '@/assets/icons/open_book_icon.svg'

type JourneyStep = {
  title: string
  beforeSession: string
  goal: string
  sessionSubject: string
  sessionTopic: string
  withTutor: string
  outcome?: string
}

type Journey = {
  key: string
  title: string
  description: string
  dropdownLabel: string
  steps: JourneyStep[]
}

const $router = useRouter()
const store = useStore()
const selectedJourney = ref<Journey | undefined>(undefined)

const journeys = computed(() => [
  {
    key: 'college',
    title: 'College Counseling Guided Journey',
    description:
      'Complete all sessions below to master the college application process',
    dropdownLabel: 'Getting into College',
    steps: [
      {
        title: 'Step 1: Build Your College List',
        beforeSession: `Review <a href="https://docs.google.com/presentation/d/1_-5GsNaAweIlbkuwJUb0p2gGx4ioUvIFNtfqKgilSP4/edit?usp=sharing" target="_blank">7 Things to Consider When Building a College List</a>`,
        goal: `Build a list of schools that you're excited to apply to!`,
        sessionSubject: 'collegeList',
        sessionTopic: 'college',
        withTutor:
          'Review your preferences and college list, learn how to access fit and acceptance requirements.',
      },
      {
        title: 'Step 2: Balance Your College List',
        beforeSession:
          'Review <a href="https://docs.google.com/presentation/d/1ecTSpOdU-xWq7Re_Ijr7UIVceC-nJazOs-x-utc-UE0/edit?usp=sharing" target="_blank">Building a Balanced College List</a>',
        goal: `Choose a mix of "likely", "target", and "reach" schools that fit your preferences`,
        sessionSubject: 'collegeList',
        sessionTopic: 'college',
        withTutor:
          'Discuss where the schools on your list most likely fall in the "likely", "target", and "reach" buckets and where to focus your efforts!',
      },
      {
        title: 'Step 3: Organize Your Requirements & Deadlines',
        beforeSession: `Make a copy of our <a href="https://docs.google.com/spreadsheets/d/1BlaqR5V5ipfWTqw2mBL7T2o8d9WFOnJ_wN6GwG-X-MY/edit?usp=sharing" target="_blank">Example College Application Organizer</a> and start investigating your target school's requirements.`,
        goal: `Know exactly what each college on your list requires and when.`,
        sessionSubject: 'collegeApps',
        sessionTopic: 'college',
        withTutor:
          'Review your Application Organizer together, research each schools application types, essays, requirements, and due dates.',
      },
      {
        title: 'Step 4: Write your Essay/Personal Statement',
        beforeSession: `Review <a href="https://docs.google.com/document/d/1QkjdOWz559VQq48eNTysh3TK10JpPYUPodDFbumYYEw/edit?usp=sharing" target="_blank">FAQ about the "College Essay"</a> and <a href="https://docs.google.com/document/d/1yPNEaPd3BAChhJi3F9Aa-TSDAYkN9TAnEsXEFTJwyXQ/edit?usp=sharing" target="_blank">Sample College Essay Analysis</a>`,
        goal: 'Build a strong essay/personal statement to use when applying to your target colleges.',
        sessionSubject: 'applicationEssays',
        sessionTopic: 'college',
        withTutor:
          'Review your brainstorming and outline and get feedback on how to maximize the effectiveness of your essay.',
      },
      {
        title: 'Step 5: Prepare for the SAT/ACT',
        beforeSession:
          'Determine what test is correct for you, and take a <a href="https://satsuite.collegeboard.org/practice/practice-tests" target="_blank">Practice Test</a>!',
        goal: 'If necessary, prepare to do your best on the SAT/ACT!',
        sessionSubject: 'collegePrep',
        sessionTopic: 'college',
        withTutor:
          'Review your practice test results and build a study plan as needed.',
      },
    ],
  },
])

async function startSession(journeyStep: JourneyStep, stepNumber: number) {
  if (!selectedJourney.value) return
  const { title, sessionTopic, sessionSubject } = journeyStep
  const { dropdownLabel, key } = selectedJourney.value
  await store.commit('session/setJourneySessionData', {
    dropdownLabel,
    key,
    stepNumber,
    title,
    subject: sessionSubject,
  })
  $router.push(`/session/${sessionTopic}/${sessionSubject}`)
}

onMounted(() => {
  selectedJourney.value = journeys.value[0]
  AnalyticsService.captureEvent(EVENTS.GUIDED_JOURNEY_VIEWED)
})
</script>

<template>
  <section class="journey-page">
    <div class="journey-container">
      <h2 class="journey-page__title">UPchieve College Journey</h2>
      <p class="journey-page__subtitle">
        We've put together a plan to help you supercharge your path to college!
        Follow these five steps to stay on track this fall.
      </p>

      <div class="steps-container">
        <div
          v-for="(step, index) in selectedJourney?.steps"
          :key="index"
          class="steps-step"
        >
          <h2 class="steps-step__title">{{ step.title }}</h2>

          <div class="steps-step__block steps-step__before-session">
            <p class="steps-step__section">
              <book-icon class="steps-step__section-icon" />
              <span>Before your session</span>
            </p>
            <p class="steps-step__section-todo" v-html="step.beforeSession"></p>
          </div>

          <div class="steps-step__block">
            <p class="steps-step__section">
              <tutor-icon class="steps-step__section-icon" />
              <span>With a tutor</span>
            </p>
            <p class="steps-step__section-todo">{{ step.withTutor }}</p>
          </div>

          <large-button
            class="steps-step__session-btn"
            @click="() => startSession(step, index + 1)"
            variant="primary-blue"
            :show-arrow="false"
            data-testid="start-session-btn"
            >Start session</large-button
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.journey-page {
  max-width: 1000px;
  width: 100%;
  padding: 2rem;

  &__title {
    @include font-category('display-small');
    margin-bottom: 0.4rem;
  }

  &__subtitle {
    color: $c-secondary-grey;
    margin: 0 0 1rem;
    max-width: 60ch;
  }
}

.journey-container {
  background-color: $upchieve-white;
  padding: 2rem;
  border-radius: 2rem;

  @include breakpoint-above('large') {
    max-width: 800px;
  }
}

.steps-container {
  display: grid;
  gap: 1.4rem;
}

.steps-step {
  @include flex-container(column, initial, initial);
  border: 1px solid $border-grey;
  border-radius: 1rem;
  padding: 1.2rem;
  margin: 1rem 0;
  width: 100%;

  &__title {
    margin-top: 0.6rem;
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 20px;
    line-height: 1.25;
    max-width: 38ch;
  }

  &__block {
    padding: 0.6rem 0.8rem;
  }

  &__before-session {
    background-color: rgba($c-success-green, 0.05);
    border: 1px solid rgba($c-success-green, 0.3);
    border-radius: 0.8rem;
  }

  &__section {
    @include flex-container(row, flex-start, center);
    gap: 0.6rem;
    font-weight: 500;
    margin: 0 0 4px;
  }

  &__section-icon {
    width: 20px;
    height: 20px;
    fill: $c-information-blue;
  }

  &__section-todo {
    color: $c-secondary-grey;
    margin: 0;
    line-height: 1.45;
  }

  &__session-btn {
    align-self: flex-end;
    margin-top: 1rem;
  }
}
</style>
