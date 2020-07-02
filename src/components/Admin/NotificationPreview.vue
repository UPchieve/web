<template>
  <div class="notification-preview">
    <div class="notification-preview__section">{{ status }}</div>
    <div class="notification-preview__section">{{ sentAt }}</div>
    <div class="notification-preview__section">
      <router-link :to="`/admin/users/${volunteer._id}`">
        {{ volunteer.firstname }}
      </router-link>
    </div>
    <div class="notification-preview__section">
      {{ organization }} volunteer
    </div>
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "NotificationPreview",

  props: {
    notification: Object
  },

  computed: {
    volunteer() {
      return this.notification ? this.notification.volunteer : {};
    },

    status() {
      if (this.notification.wasSuccessful)
        return `✅ ${this.notification.type}`;
      return `❌ ${this.notification.type}`;
    },

    sentAt() {
      return moment(this.notification.sentAt).format("l, h:mm:ss a");
    },

    organization() {
      return this.volunteer.volunteerPartnerOrg || "regular";
    }
  }
};
</script>

<style lang="scss" scoped>
.notification-preview {
  display: flex;
  padding: 20px 0;

  &__section {
    flex-grow: 1;
    min-width: 190px;
    max-width: 220px;
    text-align: left;
  }
}
</style>
