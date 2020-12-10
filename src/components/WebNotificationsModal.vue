<template>
  <modal :closeModal="closeModal">
    <div class="web-notifications-modal">
      <header>
        <h1 class="web-notifications-modal__title" v-if="user.isVolunteer">
          Do you want to turn on browser notifications?
        </h1>
        <h1 v-else class="web-notifications-modal__title">
          Do you want to be notified when a coach joins?
        </h1>
      </header>

      <h2 class="web-notifications-modal__subtitle">
        {{ description }}
      </h2>

      <separator />

      <footer class="web-notifications-modal__footer">
        <div class="web-notifications-modal__buttons">
          <large-button @click.native="closeModal">No thanks.</large-button>
          <large-button primary @click.native="requestNotificationPermission"
            >Yes, notify me!</large-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import { mapState } from "vuex";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";
import LargeButton from "@/components/LargeButton";
import setNotificationPermission from "@/utils/set-notification-permission";

export default {
  name: "WebNotificationsModal",
  components: { LargeButton, Modal, Separator },
  props: {
    closeModal: { type: Function, required: true },
    handleNotificationButton: { type: Function }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    description() {
      if (this.isVolunteerDashboardView)
        return "Turning on browser notifications will help ensure you never miss a student request while the dashboard is open. We’ll also notify you during the session if the student sends a message while you’re not looking. You can change this setting any time via your profile.";
      if (this.user.isVolunteer)
        return "Turning on browser notifications will help ensure you never miss a message from a student during your session. We’ll also notify you if a new student request comes in while you have the dashboard open. You can change this setting any time via your profile.";
      return "Turning on notifications will help you get support faster by making sure you don’t miss when your coach joins the session. We’ll also notify you during the session if they send you a message while you’re not looking.";
    },
    isVolunteerDashboardView() {
      return this.$route.name === "DashboardView" && this.user.isVolunteer;
    }
  },
  methods: {
    async requestNotificationPermission() {
      document.querySelector(".upc-modal-form").remove();
      this.isSelectionNotificationPermission = true;

      if (!("Notification" in window)) return;
      if (Notification.permission == "default") {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        this.isSelectionNotificationPermission = false;
      }
      if (this.handleNotificationButton) this.handleNotificationButton();
      this.closeModal();
    }
  }
};
</script>

<style lang="scss" scoped>
.web-notifications-modal {
  @include flex-container(column);

  &__title {
    @include font-category("display-small");
  }

  &__subtitle {
    @include font-category("body");
    margin: 0 0 35px;
    color: $c-secondary-grey;
    font-size: 15px;
  }

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);
  }
}
</style>
