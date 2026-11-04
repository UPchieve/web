<template>
  <div class="start-college-session-modal uc-column items-center">
    <updog-college />
    <h1>Want help getting into college?</h1>
    <large-button
      primary
      class="button"
      :showArrow="false"
      @click="startSession"
    >
      Chat with a coach!
    </large-button>
  </div>
</template>

<script>
import { EVENTS, POSTHOG_FEATURE_FLAGS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import UpdogCollege from '@/assets/updog-college.svg'

export default {
  name: 'StartCollegeSessionModal',
  components: {
    LargeButton,
    UpdogCollege,
  },
  props: {
    modalData: { type: Object, required: true },
  },
  computed: {
    analyticsProperties() {
      return {
        topic: this.modalData.sessionTopic,
        subject: 'college',
        featureFlag: POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION,
      }
    },
  },
  created() {
    AnalyticsService.captureEvent(
      EVENTS.STUDENT_SHOWED_START_COLLEGE_SESSION,
      this.analyticsProperties
    )
  },
  methods: {
    startSession() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_CLICKED_START_COLLEGE_SESSION,
        this.analyticsProperties
      )
      this.$router.push(`/session/college/${this.modalData.sessionTopic}/`)
    },
  },
}
</script>

<style lang="scss" scoped>
h1 {
  @include font-category('display-small');
  margin: 24px 0;
}

.button {
  margin-bottom: 30px;
  color: white;
  background-color: $c-information-blue;

  &:hover {
    background: darken($c-information-blue, 5%);
  }
}
</style>
