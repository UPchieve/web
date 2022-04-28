<template>
  <div v-if="isShowingNotificationButton">
    <large-button
      @click.native="() => setShowNotificationModal(true)"
      class="btn"
    >
      Allow browser notifications
    </large-button>

    <web-notifications-modal
      v-if="showNotificationModal"
      :closeModal="() => setShowNotificationModal(false)"
      :handleNotificationButton="handleNotificationButton"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import WebNotificationsModal from '@/components/WebNotificationsModal'
import getNotificationPermission from '@/utils/get-notification-permission'
import LargeButton from '@/components/LargeButton.vue'

export default {
  name: 'WebNotificationsButton',
  components: { WebNotificationsModal, LargeButton },
  data() {
    return {
      showNotificationModal: false,
      isShowingNotificationButton: false
    }
  },
  mounted() {
    this.handleNotificationButton()
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      isMobileApp: state => state.app.isMobileApp
    })
  },
  methods: {
    setShowNotificationModal(value) {
      this.showNotificationModal = value
    },
    handleNotificationButton() {
      // User is a volunteer who is not onboarded or approved
      // or user is using the mobile app
      if (
        (this.user.isVolunteer &&
          (!this.user.isOnboarded || !this.user.isApproved)) ||
        this.isMobileApp
      )
        return

      this.isShowingNotificationButton =
        getNotificationPermission() === 'default'
    }
  }
}
</script>

<style lang="scss" scoped>
.btn {
  background-color: $c-success-green;
  color: #fff;
  @include font-category('helper-text');
  font-weight: 500;
  border: none;

  &:hover {
    background-color: darken($c-success-green, 5%);
  }
}
</style>
