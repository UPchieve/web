<template>
  <div class="uc-column items-center">
    <updog-college />
    <h1>Want help getting into college?</h1>
    <large-button
      primary
      class="button"
      @click="startSession"
      :showArrow="false"
      >Chat with a coach!
    </large-button>
  </div>
</template>

<script>
import { EVENTS } from '@/consts'
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
  created() {
    AnalyticsService.captureEvent(
      EVENTS.BF_STUDENT_SHOWED_START_COLLEGE_SESSION
    )
  },
  methods: {
    startSession() {
      AnalyticsService.captureEvent(
        EVENTS.BF_STUDENT_CLICKED_START_COLLEGE_SESSION,
        {
          topic: this.modalData.sessionTopic,
          subject: 'college',
        }
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
  background-color: $c-information-blue;
  color: white;
  margin-bottom: 30px;

  &:hover {
    background: darken($c-information-blue, 5%);
  }
}
</style>
