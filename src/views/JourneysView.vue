<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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

function startSession(journeyStep: JourneyStep, row: number) {
  if (!selectedJourney.value) return
  const { title, sessionTopic, sessionSubject } = journeyStep
  const { dropdownLabel, key } = selectedJourney.value
  const journeyData = {
    dropdownLabel,
    key,
    row,
    title,
    subject: sessionSubject,
  }

  AnalyticsService.captureEvent(
    EVENTS.GUIDED_JOURNEY_SESSION_REQUESTED,
    journeyData
  )
  $router.push(`/session/${sessionTopic}/${sessionSubject}`)
}

onMounted(async () => {
  selectedJourney.value = journeys.value[0]
  AnalyticsService.captureEvent(EVENTS.GUIDED_JOURNEY_VIEWED)
})
</script>

<template>
  <section class="journey-page">
    <div class="journey-wrapper">
      <section class="journey-steps">
        <div class="journey-steps-wrapper">
          <h2>UPchieve College Journey</h2>
          <p>
            We've put together a plan to help you supercharge your path to
            college! Follow these five steps to stay on track this fall!
          </p>

          <div>
            <div
              v-for="(step, index) in selectedJourney?.steps"
              :key="index"
              class="journey-step"
            >
              <div class="journey-step__info">
                <h2 class="journey-step__title">{{ step.title }}</h2>
                <div>
                  <p class="journey-step__action-title-container">
                    <book-icon />
                    <span class="journey-step__action-title"
                      >Before your session:</span
                    >
                  </p>
                  <p v-html="step.beforeSession"></p>
                </div>
                <div>
                  <p class="journey-step__action-title-container">
                    <tutor-icon />
                    <span class="journey-step__action-title"
                      >With a tutor:</span
                    >
                  </p>
                  <p>{{ step.withTutor }}</p>
                </div>
              </div>
              <large-button
                @click="() => startSession(step, index + 1)"
                variant="primary-blue"
                >Start session</large-button
              >
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.journey {
  &-page {
    max-width: 1800px;
    width: 100%;
  }

  &-description {
    font-size: 18px;
    margin: 1em 0;
  }

  &-wrapper {
    padding: 2em;
    border-radius: 2em;
  }

  &-steps {
    &-wrapper {
      background-color: $upchieve-white;
      padding: 2em;
      border-radius: 2em;
    }
  }

  &-step {
    @include flex-container(column, center, center);
    border: 1px solid $border-grey;
    padding: 2em;

    @include breakpoint-above('large') {
      @include flex-container(row, space-between, center);
    }

    &__info {
      width: 75%;
    }

    &__title {
      margin-bottom: 0.4em;
      font-size: 22px;
      font-weight: 500;
    }

    &__action-title-container {
      @include flex-container(row, initial, center);
      margin-bottom: 0;
    }

    &__action-title {
      font-weight: 500;
      margin-left: 0.4em;
    }
  }

  &-goals {
    width: 60%;
    margin: 0 auto;
    margin-top: 2em;

    &__label {
      font-size: 20px;
      margin-bottom: 0;
    }

    &__select {
      background-color: $upchieve-white;
    }
  }

  &-how-helps {
    @include font-category('heading');
    margin-bottom: 0;
  }
}

.icon {
  width: 80px;
  height: 80px;
  margin-right: 1em;
}
</style>
