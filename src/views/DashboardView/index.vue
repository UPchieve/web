<template>
  <volunteer-dashboard v-if="isVolunteer" />
  <student-dashboard v-else-if="isStudent" />
  <!-- TODO: TEACHER PROFILES. -->
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import VolunteerDashboard from './VolunteerDashboard/index.vue'
import StudentDashboard from './StudentDashboard/index.vue'
import ProductDiscoveryService from '@/services/ProductDiscoveryService'

export default {
  name: 'dashboard-view',
  components: { VolunteerDashboard, StudentDashboard },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      gleapSegmentExperiments: 'featureFlags/gleapSegmentExperiments',
      isGleapSegmentExperimentsActive:
        'featureFlags/isGleapSegmentExperimentsActive',
    }),
    userGleapSegments() {
      return [this.user, this.gleapSegmentExperiments]
    },
  },
  mounted() {
    if (this.isGleapSegmentExperimentsActive)
      ProductDiscoveryService.triggerDynamicGleapWidget(
        this.user,
        this.gleapSegmentExperiments
      )
  },
  watch: {
    userGleapSegments: {
      handler: function (currentValue, prevValue) {
        if (
          Object.keys(currentValue[0]).length &&
          currentValue[1].length &&
          (!Object.keys(prevValue[0]).length || !prevValue[1].length)
        )
          ProductDiscoveryService.triggerDynamicGleapWidget(
            this.user,
            this.gleapSegmentExperiments
          )
      },
      deep: true,
    },
  },
}
</script>
