<template>
  <banner-template :onCancel="onCancel">
    <component v-if="bannerComponent" v-bind:is="bannerComponent" />
  </banner-template>
</template>

<script>
import { mapState } from 'vuex'
import BannerTemplate from './BannerTemplate.vue'
import MobileAppNoticeBanner from './MobileAppNoticeBanner.vue'

export default {
  components: {
    BannerTemplate,
    MobileAppNoticeBanner,
  },
  computed: {
    ...mapState({
      bannerComponent: (state) => state.app.banner.component,
    }),
  },
  methods: {
    onCancel() {
      this.$store.dispatch('app/banner/hide')
    },
  },
}
</script>
