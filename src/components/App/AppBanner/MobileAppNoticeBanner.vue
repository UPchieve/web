<template>
  <div>
    <p class="banner-description">
      Visit the {{ mobileAppStore }} to download the UPchieve App!
    </p>
    <div class="banner-container">
      <div class="mobile-app-info">
        <div class="logo-background">
          <app-store-logo class="mobile-app-store-logo" />
        </div>
        <span class="mobile-app-store-title">
          UPchieve App
        </span>
      </div>
      <a :href="mobileAppStoreLink" class="mobile-app-store-link">Visit</a>
    </div>
  </div>
</template>

<script>
import LogoImageUrl from '@/assets/header_logo.png'
import getOperatingSystem from '@/utils/get-operating-system'
import AppStoreLogo from '@/assets/app-store-logo.svg'
import { GOOGLE_PLAY_STORE_LINK, APP_STORE_LINK } from '@/consts'

export default {
  name: 'mobile-app-notice-banner',
  components: { AppStoreLogo },
  data() {
    return { logoUrl: LogoImageUrl }
  },
  computed: {
    mobileAppStoreLink() {
      if (this.mobileAppStore === 'Google Play Store') {
        return GOOGLE_PLAY_STORE_LINK
      }
      if (this.mobileAppStore === 'App Store') {
        return APP_STORE_LINK
      }
      return ''
    },
    mobileAppStore() {
      const device = getOperatingSystem()

      if (device === 'Android') {
        return 'Google Play Store'
      }
      if (device === 'iOS') {
        return 'App Store'
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
p {
  padding: 0;
  margin: 0;
}

.banner-description {
  text-align: left;
}

.banner-container {
  @include flex-container(row, space-between, center);
  margin: 1em 0;
}

.mobile-app-info {
  display: flex;
  align-items: center;
}

.mobile-app-store-title {
  font-weight: 500;
  padding: 0 0.6em;
}

.mobile-app-store-link {
  color: $c-success-green;
  border: 1px solid $c-success-green;
  border-radius: 5px;
  padding: 0.4em 0.8em;
}

.logo-background {
  background-color: $c-success-green;
  display: flex;
  border-radius: 8px;
  padding: 1em;
}

.mobile-app-banner-upchieve-logo {
  & g {
    fill: white;
  }
}
</style>
