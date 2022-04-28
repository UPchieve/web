<template>
  <div class="NotificationsContainer">
    <div class="LoadingContainer" v-if="isLoadingSession">
      <loading-message message="Starting your session" />
    </div>
    <div class="NotificationsModal" v-else>
      <h1 class="NotificationsModal-title">Turn on notifications</h1>
      <h2 class="NotificationsModal-subtitle">
        An UPchieve volunteer is on the way! This could take up to 10 minutes.
        Do you want us to send you a notification once they’ve entered the chat?
      </h2>

      <div v-if="!mobileMode" class="seperator" />
      <div class="NotificationsModal-buttons">
        <large-button @click.native="onClose()"
          >Nah, I'll check every minute.</large-button
        >
        <large-button primary @click.native="handlePushNotification()"
          >Yes, please notify me!</large-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { startSession } from '@/utils/session'
import LargeButton from '@/components/LargeButton'
import PortalService from '@/services/PortalService'
import NetworkService from '@/services/NetworkService'
import LoadingMessage from '@/components/LoadingMessage'
import setCookie from '@/utils/set-cookie'
import * as Sentry from '@sentry/browser'

export default {
  components: { LargeButton, LoadingMessage },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      selectedSubtopic: '',
      isLoadingSession: false
    }
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp
    }),
    ...mapGetters({ mobileMode: 'app/mobileMode' }),
    title() {
      return this.modalData.topic
        ? `Choose a ${this.modalData.topic} subject`
        : 'Choose a subject'
    }
  },
  methods: {
    async handlePushNotification() {
      const { topic, selectedSubtopic } = this.modalData
      setCookie('hasSentPushTokenRegister', true)

      try {
        this.isLoadingSession = true

        const { token } = await PortalService.call('push.register')
        await NetworkService.savePushToken(this, { token })

        startSession(this.$router, topic, selectedSubtopic)
      } catch (error) {
        if (error.status !== 422) {
          Sentry.captureException(error)
        }

        startSession(this.$router, topic, selectedSubtopic)
      }
    },
    async onClose() {
      this.$emit('cancel')
      this.$store.dispatch('app/modal/hide')
      setCookie('hasSentPushTokenRegister', true)

      const { topic, selectedSubtopic } = this.modalData
      startSession(this.$router, topic, selectedSubtopic)
    }
  }
}
</script>

<style lang="scss" scoped>
h1,
h2,
p {
  margin: 0;
  padding: 0;
}

.NotificationsContainer {
  display: flex;
  height: 100%;

  // set a min-height for when loading message shows
  @include breakpoint-above('medium') {
    min-height: 200px;
  }
}

.NotificationsModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  height: 100%;
}

.NotificationsModal-title {
  @include font-category('display-small');
  @include breakpoint-above('medium') {
    margin-top: 24px;
  }
}

.NotificationsModal-subtitle {
  @include font-category('heading');
  color: $c-secondary-grey;
}

.NotificationsModal-buttons {
  @include flex-container(column);
  @include child-spacing(top, 16px);
  margin-top: auto;
  margin-bottom: 4em;

  & > button {
    margin-bottom: 0.5em;
    padding: 1em 0;
  }

  @include breakpoint-above('medium') {
    @include child-spacing(top, 0);

    flex-direction: row;
    justify-content: space-around;
    margin-top: 1.4em;
    margin-bottom: 0;

    & > button {
      padding: 0.8em;
    }
  }
}

.LoadingContainer {
  @include font-category('display-small');
  margin: 0 auto;
  align-self: center;
}

.seperator {
  border: 1px solid $c-border-grey;
  width: 100%;
  height: 1px;
  margin-top: 2em;
}
</style>
