<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS, POSTHOG_FEATURE_FLAGS } from '@/consts'

const store = useStore()
const route = useRoute()

const payload = computed(
  () =>
    store.getters['featureFlags/volunteerRelevantExperienceFakeDoorPayload'] ??
    {}
)
const surveyUrl = computed(() => payload.value.surveyUrl ?? '')
const interestType = Array.isArray(route.query.interestType)
  ? route.query.interestType[0]
  : route.query.interestType
const properties = {
  experiment: POSTHOG_FEATURE_FLAGS.VOLUNTEER_RELEVANT_EXPERIENCE_FAKE_DOOR,
  interestType: interestType ?? 'unknown',
}

function openSurvey() {
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_VOLUNTEER_RELEVANT_EXPERIENCE_SURVEY_CLICKED,
    properties
  )
}

onMounted(() =>
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_VOLUNTEER_RELEVANT_EXPERIENCE_THANK_YOU_VIEWED,
    properties
  )
)
</script>

<template>
  <main
    class="volunteer-relevant-experience-thanks"
    data-testid="volunteer-relevant-experience-thanks"
  >
    <header class="volunteer-relevant-experience-thanks__header">
      <router-link
        class="volunteer-relevant-experience-thanks__back"
        to="/dashboard"
      >
        ← Dashboard
      </router-link>
      <h1>Thanks for your interest!</h1>
      <p>
        This isn't something we've built yet, but we want to learn how to make
        it as useful as possible for you.
      </p>
    </header>

    <section class="volunteer-relevant-experience-thanks__content">
      <h2>Help us build this for students like you</h2>
      <p>
        Take a short survey to tell us who you'd want to meet and what you'd
        ask.
      </p>
      <a
        v-if="surveyUrl"
        class="volunteer-relevant-experience-thanks__survey"
        :href="surveyUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click="openSurvey"
      >
        Take the short survey
      </a>
      <p v-else class="volunteer-relevant-experience-thanks__unavailable">
        The survey is being prepared. Thanks—your interest has been recorded.
      </p>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.volunteer-relevant-experience-thanks {
  box-sizing: border-box;
  width: auto;
  max-width: 1200px;
  margin: 10px;
  padding: 20px 15px 60px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 0 0 60px;
  }
}

.volunteer-relevant-experience-thanks__header {
  margin-bottom: 24px;

  h1 {
    margin: 14px 0 8px;
    color: $c-information-blue;
    font-size: 30px;
  }

  p {
    max-width: 760px;
    margin: 0;
    color: $c-secondary-grey;
    line-height: 1.55;
  }
}

.volunteer-relevant-experience-thanks__back {
  color: $c-secondary-grey;
  font-size: 0.9rem;

  &:hover {
    color: $c-information-blue;
  }
}

.volunteer-relevant-experience-thanks__content {
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  padding: 24px;
  border-radius: 8px;
  background: white;
  text-align: left;

  h2 {
    margin: 0 0 10px;
    font-size: 20px;
  }

  p {
    max-width: 760px;
    margin: 0 0 20px;
    line-height: 1.55;
  }
}

.volunteer-relevant-experience-thanks__unavailable {
  padding: 12px;
  border-radius: 8px;
  background: $c-background-grey;
}
.volunteer-relevant-experience-thanks__survey {
  display: inline-flex;
  padding: 10px 22px;
  border-radius: 22px;
  background: $c-information-blue;
  color: white;
  font-weight: 600;
  text-decoration: none;
}
</style>
