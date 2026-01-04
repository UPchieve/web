<template>
  <volunteer-dashboard v-if="isVolunteer" />
  <student-dashboard v-else-if="isStudent" />
  <teacher-dashboard v-else-if="isTeacher" />
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import StudentDashboard from './StudentDashboard/index.vue'
import TeacherDashboard from './TeacherDashboard/index.vue'
import VolunteerDashboard from './VolunteerDashboard/index.vue'

export default {
  name: 'dashboard-view',
  components: { VolunteerDashboard, StudentDashboard, TeacherDashboard },
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
