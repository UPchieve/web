<template>
  <div :class="{ video: true, '`${props.cssClass}`': !!cssClass }">
    <iframe
      v-show="isLoaded"
      :width="videoWidth"
      :height="videoHeight"
      class="video"
      :src="`https://player.vimeo.com/video/${resourceId}`"
      allow="autoplay; fullscreen"
      allowfullscreen
      title="external video for training"
      @load="onLoaded"
    ></iframe>
    <Loader v-if="!isLoaded" />
    <link-material v-if="pdf" :linkUrl="pdf" :label="'PDF Version'" />
    <resources-material :links="links" />
  </div>
</template>

<script>
import LinkMaterial from './Link.vue'
import ResourcesMaterial from './Resources.vue'
import Loader from '@/components/Loader.vue'

export default {
  components: {
    Loader,
    LinkMaterial,
    ResourcesMaterial,
  },
  data() {
    return {
      isLoaded: false,
    }
  },
  props: {
    resourceId: String,
    pdf: String,
    links: Array,
    cssClass: {
      type: String,
      default: null,
    },
  },
  methods: {
    onLoaded() {
      this.isLoaded = true
    },
  },
  computed: {
    videoWidth() {
      return this.$store.getters['app/mobileMode'] ? 300 : 560
    },
    videoHeight() {
      return this.$store.getters['app/mobileMode'] ? 150 : 315
    },
  },
}
</script>

<style lang="scss" scoped>
.video {
  color: black;
  width: 100%;
}
</style>
