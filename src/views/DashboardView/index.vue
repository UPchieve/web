<template>
  <volunteer-dashboard v-if="isVolunteer" />
  <student-dashboard v-else />
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import VolunteerDashboard from './VolunteerDashboard'
import StudentDashboard from './StudentDashboard'
import ProductDiscoveryService from '@/services/ProductDiscoveryService'

export default {
  name: 'dashboard-view',
  components: { VolunteerDashboard, StudentDashboard },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      gleapBotSegmentExperiments: 'featureFlags/gleapBotSegmentExperiments',
      isGleapBotSegmentExperimentsActive:
        'featureFlags/isGleapBotSegmentExperimentsActive',
    }),
    userGleapBotSegment() {
      return [this.user, this.gleapBotSegmentExperiments]
    },
  },
  mounted() {
    if (this.isGleapBotSegmentExperimentsActive)
      ProductDiscoveryService.triggerDynamicGleapBot(
        this.user,
        this.gleapBotSegmentExperiments
      )
  },
  watch: {
    userGleapBotSegment: {
      handler: function(currentValue, prevValue) {
        if (
          Object.keys(currentValue[0]).length &&
          currentValue[1].length &&
          (!Object.keys(prevValue[0]).length || !prevValue[1].length)
        )
          ProductDiscoveryService.triggerDynamicGleapBot(
            this.user,
            this.gleapBotSegmentExperiments
          )
      },
      deep: true,
    },
  },
}
</script>
