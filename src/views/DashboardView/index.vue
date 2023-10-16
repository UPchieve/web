<template>
  <volunteer-dashboard v-if="isVolunteer" />
  <student-dashboard v-else />
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
      user: state => state.user.user,
      featureFlags: state => state.featureFlags.flags,
    }),
    ...mapGetters({
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      gleapSegmentExperiments: 'featureFlags/gleapSegmentExperiments',
      isGleapSegmentExperimentsActive:
        'featureFlags/isGleapSegmentExperimentsActive',
    }),
    userGleapSegments() {
      return [this.user, this.gleapSegmentExperiments, this.featureFlags]
    },
  },
  mounted() {
    if (this.isGleapSegmentExperimentsActive)
      ProductDiscoveryService.triggerDynamicGleapWidget(
        this.user,
        this.gleapSegmentExperiments,
        this.featureFlags
      )
  },
  watch: {
    userGleapSegments: {
      handler: function(currentValue, prevValue) {
        if (
          Object.keys(currentValue[0]).length &&
          currentValue[1].length &&
          Object.keys(currentValue[2]).length &&
          (!Object.keys(prevValue[0]).length ||
            !prevValue[1].length ||
            !Object.keys(currentValue[2]).length)
        )
          ProductDiscoveryService.triggerDynamicGleapWidget(
            this.user,
            this.gleapSegmentExperiments,
            this.featureFlags
          )
      },
      deep: true,
    },
  },
}
</script>
