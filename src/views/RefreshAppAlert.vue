<template>
  <ion-alert
    v-if="shouldShow"
    :is-open="shouldShow"
    :header="getHeader"
    :message="getMessage"
    :buttons="getButtons"
    class="refresh-alert"
    data-testid="refresh-app-ion-alert"
  />
</template>

<script>
import { IonAlert } from '@ionic/vue'
import VersionService from '@/services/VersionService'
import { mapState } from 'vuex'

export default {
  name: 'RefreshAppAlert',
  components: {
    IonAlert,
  },
  async created() {
    await this.getCurrentServerVersion()
  },
  async mounted() {
    await this.getCurrentServerVersion()
    // every 10 minutes, check the current server version
    this.checkForUpdateIntervalId = setInterval(
      () => {
        this.getCurrentServerVersion()
      },
      1000 * 60 * 10
    )
  },
  data() {
    return {
      newServerVersionAvailable: false,
    }
  },
  methods: {
    async getCurrentServerVersion() {
      const version = await VersionService.getCurrentServerVersion()
      if (!this.version) {
        this.$store.commit('app/setVersion', version)
        return
      }

      if (version !== this.version) {
        this.newServerVersionAvailable = true
      }
    },
    refreshPage() {
      window.location.reload()
    },
  },
  computed: {
    ...mapState({
      showCsrfRefreshAlert: (state) => state.app.showCsrfRefreshAlert,
      version: (state) => state.app.version,
    }),
    shouldShow() {
      return this.newServerVersionAvailable || this.showCsrfRefreshAlert
    },
    getHeader() {
      return this.showCsrfRefreshAlert
        ? 'Oops! Something went wrong.'
        : 'New version of UPchieve available!'
    },
    getButtons() {
      return [
        {
          text: 'Not now',
          rol: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: this.showCsrfRefreshAlert ? 'Refresh' : 'Upgrade',
          rol: 'confirm',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.refreshPage()
          },
        },
      ]
    },
    getMessage() {
      if (this.showCsrfRefreshAlert) {
        // Prefer the more urgent message when both apply
        return 'Please refresh the page.'
      } else {
        return 'Upgrade now to get the latest version.'
      }
    },
  },
}
</script>

<style lang="scss">
%LargeButton {
  border: 1px solid rgba(0, 0, 0, 0); // for consistent button size
  border-radius: 20px;
  padding: 9px 23px; // subtracted 1px for border
  display: inline-flex;
}
.refresh-alert {
  .alert-button-group {
    padding-bottom: 20px;
  }
  .alert-button-confirm {
    @extend %LargeButton;

    background: $c-success-green;
    color: white;

    &:hover {
      background: darken($c-success-green, 5%);
      color: $c-background-grey;
    }

    &:disabled {
      background: $c-background-grey;
      color: $c-disabled-grey;
    }

    &--reverse {
      background: white;
      color: $c-success-green;
    }
  }
  .alert-button-cancel {
    @extend %LargeButton;

    background: white;
    border-color: $c-border-grey;
    color: $c-soft-black;

    &:hover {
      border-color: $c-soft-black;
    }

    &:disabled {
      background: $c-background-grey;
      border-color: $c-background-grey;
      color: $c-disabled-grey;
    }

    &--reverse {
      border-color: white;
    }
  }
}
</style>
