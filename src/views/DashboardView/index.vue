<template>
  <LeftQueueToast />
  <volunteer-dashboard v-if="isVolunteer" v-bind="$attrs" />
  <student-dashboard v-else-if="isStudent" v-bind="$attrs" />
  <teacher-dashboard v-else-if="isTeacher" v-bind="$attrs" />
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import LeftQueueToast from './LeftQueueToast.vue'
import StudentDashboard from './StudentDashboard/index.vue'
import TeacherDashboard from './TeacherDashboard/index.vue'
import VolunteerDashboard from './VolunteerDashboard/index.vue'

export default {
  name: 'dashboard-view',
  inheritAttrs: false,
  components: {
    LeftQueueToast,
    VolunteerDashboard,
    StudentDashboard,
    TeacherDashboard,
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
    }),
  },
  mounted() {
    if (this.isTeacher) {
      this.$router.replace(`/dashboard/teacher`)
    }
  },
}
</script>
