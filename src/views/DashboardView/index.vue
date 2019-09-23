<template>
  <volunteer-dashboard v-if="user.isVolunteer" />
  <student-dashboard v-else />
</template>

<script>
import UserService from "@/services/UserService";
import VolunteerDashboard from "./VolunteerDashboard";
import StudentDashboard from "./StudentDashboard";

export default {
  name: "dashboard-view",
  components: { VolunteerDashboard, StudentDashboard },
  data() {
    return { user: { isVolunteer: false } };
  },
  created() {
    UserService.getUser(this).then(user => (this.user = user));
  }
};
</script>
