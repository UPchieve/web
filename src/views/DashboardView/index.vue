<template>
  <volunteer-dashboard v-if="isVolunteer" />
  <student-dashboard v-else />
</template>

<script>
import { mapGetters } from "vuex";

import VolunteerDashboard from "./VolunteerDashboard";
import StudentDashboard from "./StudentDashboard";

export default {
  name: "dashboard-view",
  components: { VolunteerDashboard, StudentDashboard },
  computed: {
    ...mapGetters({
      isAuthenticated: "user/isAuthenticated",
      isVolunteer: "user/isVolunteer"
    })
  }
};
</script>
