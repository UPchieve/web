<template>
  <div v-if="showNotificationButton">
    <large-button @click.native="toggleNotificationModal" class="btn">
      Allow notifications
    </large-button>

    <web-notifications-modal
      v-if="showNotificationModal"
      :closeModal="toggleNotificationModal"
      :requestNotificationPermission="requestNotificationPermission"
    />
    <div v-if="isSelectionNotificationPermission" class="upc-modal" />
  </div>
</template>

<script>
import { mapState } from "vuex";
import WebNotificationsModal from "@/components/WebNotificationsModal";
import getNotificationPermission from "@/utils/get-notification-permission";
import setNotificationPermission from "@/utils/set-notification-permission";
import LargeButton from "@/components/LargeButton.vue";

export default {
  name: "WebNotificationsButton",
  components: { WebNotificationsModal, LargeButton },
  data() {
    return {
      showNotificationModal: false,
      isSelectionNotificationPermission: false,
      showNotificationButton: false
    };
  },
  mounted() {
    this.displayButton();
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      isMobileApp: state => state.app.isMobileApp
    })
  },
  methods: {
    toggleNotificationModal() {
      this.showNotificationModal = !this.showNotificationModal;
    },
    async requestNotificationPermission() {
      this.toggleNotificationModal();
      this.isSelectionNotificationPermission = true;

      if (!("Notification" in window)) return;
      if (Notification.permission == "default") {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        this.isSelectionNotificationPermission = false;
        this.displayButton();
      }
    },
    displayButton() {
      // User is a volunteer who is not onboarded or approved
      // or user is using the mobile app
      if (
        (this.user.isVolunteer &&
          (!this.user.isOnboarded || !this.user.isApproved)) ||
        this.isMobileApp
      )
        return;

      this.showNotificationButton = getNotificationPermission() === "default";
    }
  }
};
</script>

<style lang="scss" scoped>
.btn {
  background-color: $c-success-green;
  color: #fff;
  margin-top: 2em;
}
</style>
