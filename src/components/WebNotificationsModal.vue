<template>
  <modal :closeModal="closeModal">
    <div class="web-notifications-modal">
      <header>
        <h1 class="web-notifications-modal__title">
          Stay updated!
        </h1>
      </header>

      <h2 class="web-notifications-modal__subtitle">
        {{ userNotificationMessage }}
      </h2>

      <separator />

      <footer class="web-notifications-modal__footer">
        <div class="web-notifications-modal__buttons">
          <large-button @click.native="closeModal">Cancel</large-button>
          <large-button primary @click.native="requestNotificationPermission"
            >Notify me</large-button
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

export default {
  name: "WebNotificationsModal",
  components: { LargeButton, Modal, Separator },
  props: {
    closeModal: { type: Function, required: true },
    requestNotificationPermission: { type: Function, required: true }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    userNotificationMessage() {
      if (this.user.isVolunteer)
        return "Receive notifications for when a student needs your help and when you receive a chat message!";
      return "Receive notifications for when a volunteer joins your session and sends you messages!";
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
