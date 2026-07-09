<template>
  <modal :closeModal="closeModal">
    <div class="web-notifications-modal">
      <updog-notification class="web-notifications-modal__image" />
      <header>
        <h1 class="web-notifications-modal__title" v-if="isVolunteer">
          Turn on browser notifications?
        </h1>
        <h1 v-else class="web-notifications-modal__title">
          Want us to let you know when your tutor joins?
        </h1>
      </header>

      <h2 class="web-notifications-modal__subtitle">
        {{ description }}
      </h2>

      <footer class="web-notifications-modal__footer">
        <div class="web-notifications-modal__buttons">
          <large-button
            class="web-notifications-modal__yes_button"
            variant="primary-blue"
            :showArrow="false"
            @click="requestNotificationPermission"
          >
            <notification-bell-icon class="icon" />
            Yes, notify me!
          </large-button>
          <hyperlink-button
            data-testid="close-notification-modal"
            class="web-notifications-modal__no_button"
            @click="closeModal"
            >No, thanks</hyperlink-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import HyperlinkButton from '@/components/HyperlinkButton.vue'
import setNotificationPermission from '@/utils/set-notification-permission'
import NotificationBellIcon from '@/assets/notification-bell.svg'
import UpdogNotification from '@/assets/updog-notification.svg'

export default {
  name: 'WebNotificationsModal',
  components: {
    LargeButton,
    HyperlinkButton,
    Modal,
    NotificationBellIcon,
    UpdogNotification,
  },
  props: {
    closeModal: { type: Function, required: true },
    handleNotificationButton: { type: Function },
  },
  computed: {
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
    }),
    ...mapState({
      user: (state) => state.user.user,
    }),
    description() {
      if (this.isVolunteer)
        return "Turn on browser notifications so we can let you know when a student requests help or sends a message during a session — even if you're on another tab. You can update this anytime in your profile."
      if (this.isStudent) return 'Turn on notifications to get notified!'

      return ''
    },
  },
  methods: {
    async requestNotificationPermission() {
      this.isSelectionNotificationPermission = true
      if (!('Notification' in window)) return
      if (Notification.permission == 'default') {
        const result = await Notification.requestPermission()
        setNotificationPermission(result)
        this.isSelectionNotificationPermission = false
      }
      if (this.handleNotificationButton) this.handleNotificationButton()
      this.closeModal()
    },
  },
}
</script>

<style lang="scss" scoped>
.web-notifications-modal {
  @include flex-container(column, center, center);

  &__image {
    margin: 0 0 32px;
  }

  &__title {
    @include font-category('display-small');
    padding-left: 48px;
    padding-right: 48px;
  }

  &__subtitle {
    @include font-category('body');
    margin: 8px 0 16px;
    color: $c-secondary-grey;
    font-size: 15px;
    padding-left: 48px;
    padding-right: 48px;
  }

  &__buttons {
    margin-top: 16px;
    margin-bottom: 16px;
    @include flex-container(column, center, center);
    @include child-spacing(top, 16px);
  }
  &__yes_button {
    padding-left: 64px;
    padding-right: 64px;
  }
  &__no_button {
    padding-left: 64px;
    padding-right: 64px;
    color: $c-soft-black;
  }
}
</style>
