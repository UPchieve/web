<template>
  <banner-template :onCancel="onCancel">
    <component v-if="bannerComponent" v-bind:is="bannerComponent" />
  </banner-template>
</template>

<script>
import { mapState } from "vuex";
import BannerTemplate from "./BannerTemplate";

export default {
  components: {
    BannerTemplate
  },
  computed: {
    ...mapState({
      bannerComponent: state => state.app.banner.component
    })
  },
  methods: {
    onCancel() {
      this.$store.dispatch("app/banner/hide");
    }
  }
};
</script>
