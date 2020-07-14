<template>
  <div class="notification-preview">
    <div class="notification-preview__section">{{ status }}</div>
    <div class="notification-preview__section">{{ sentAt }}</div>
    <div class="notification-preview__section">
      <router-link :to="`/admin/users/${volunteer._id}`">
        to {{ volunteer.firstname }}
      </router-link>
    </div>
    <div class="notification-preview__section">
      {{ organization }} volunteer
    </div>
    <div class="notification-preview__section">
      {{ priorityGroup }}
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
    },

    priorityGroup() {
      return this.notification.priorityGroup
        ? this.notification.priorityGroup
        : "No priority group stored";
    }
  }
};
</script>

<style lang="scss" scoped>
.notification-preview {
  display: flex;
  padding: 10px 0;
  height: 70px;
  align-items: center;

  &__section {
    flex-grow: 0;
    flex-shrink: 0;
    width: 180px;
    text-align: left;
  }
}
</style>
