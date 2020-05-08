<template>
  <div class="admin-user-detail">
    <sessions-list :sessions="user.pastSessions" />
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import SessionsList from "@/components/Admin/SessionsList";

const getUser = async userId => {
  const {
    body: { user }
  } = await NetworkService.adminGetUser(userId);

  return user;
};

export default {
  name: "AdminUserDetail",

  components: { SessionsList },

  data() {
    return {
      user: {}
    };
  },

  async created() {
    this.user = await getUser(this.$route.params.userId);
  }
};
</script>

<style lang="scss" scoped>
.admin-user-detail {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}
</style>
