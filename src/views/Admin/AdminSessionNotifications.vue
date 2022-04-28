<template>
  <div class="session-notifications">
    <div class="session-notifications__back" @click="goBack">
      <span>← Back</span>
    </div>
    <div
      v-for="notif in notifications"
      :key="notif._id"
      class="session-notifications__notif"
    >
      <notification-preview :notification="notif" />
    </div>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import NotificationPreview from '@/components/Admin/NotificationPreview'

export default {
  name: 'AdminSessionNotifications',

  components: { NotificationPreview },

  data() {
    return {
      notifications: []
    }
  },

  methods: {
    goBack() {
      this.$router.go(-1)
    }
  },

  async created() {
    const {
      body: { notifications }
    } = await NetworkService.adminGetSessionNotifications(
      this.$route.params.sessionId
    )

    this.notifications = notifications
  }
}
</script>

<style lang="scss" scoped>
.session-notifications {
  background: #fff;
  margin: 10px;
  padding: 20px 15px;
  border-radius: 8px;
  overflow-x: scroll;
  text-align: left;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }

  &__back {
    margin: 0 0 20px 0;
    display: inline-flex;
    align-items: center;
    color: #417db1;
    border-radius: 20px;
    padding: 5px 15px;
    cursor: pointer;

    &:hover {
      background: #f7fcfe;
    }
  }
}
</style>
