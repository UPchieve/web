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
    const user = UserService.getUser() || {};
    return { user };
  }
};
</script>
