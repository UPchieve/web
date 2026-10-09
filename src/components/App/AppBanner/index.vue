<template>
  <banner-template @close="onCancel">
    <component v-if="bannerComponent" v-bind:is="bannerComponent" />
  </banner-template>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAppBannerStore } from '@/stores/app/banner'
import BannerTemplate from './BannerTemplate.vue'
import MobileAppNoticeBanner from './MobileAppNoticeBanner.vue'

export default {
  components: {
    BannerTemplate,
    MobileAppNoticeBanner,
  },
  computed: {
    ...mapState(useAppBannerStore, { bannerComponent: 'component' }),
  },
  methods: {
    ...mapActions(useAppBannerStore, { hideBanner: 'hide' }),
    onCancel() {
      this.hideBanner()
    },
  },
}
</script>
