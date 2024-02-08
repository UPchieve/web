<template>
  <div class="video">
    <iframe
      class="video__iframe"
      :src="`https://player.vimeo.com/video/${resourceId}`"
      allow="autoplay; fullscreen"
      allowfullscreen
      title="external video for training"
    ></iframe>
    <link-material v-if="pdf" :linkUrl="pdf" :label="'PDF Version'" />
    <resources-material :links="links" />
  </div>
</template>

<script>
import LinkMaterial from './Link.vue'
import ResourcesMaterial from './Resources.vue'

export default {
  components: {
    LinkMaterial,
    ResourcesMaterial,
  },
  props: {
    resourceId: String,
    pdf: String,
    links: Array,
  },
}
</script>

<style lang="scss" scoped>
.video {
  color: black;

  &__iframe {
    width: 100%;
    height: 400px;
  }
}
</style>
