<template>
  <div class="admin-sessions">
    <sessions-list :sessions="sessions" />
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import SessionsList from "@/components/Admin/SessionsList";

export default {
  name: "AdminSessions",

  components: { SessionsList },

  data() {
    return {
      sessions: []
    };
  },

  async created() {
    const {
      body: { sessions }
    } = await NetworkService.adminGetSessions();
    this.sessions = sessions;
  }
};
</script>

<style lang="scss" scoped>
.admin-sessions {
  background: #fff;
  margin: 10px;
  border-radius: 8px;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}
</style>
