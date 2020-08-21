<template>
  <div class="video">
    <iframe
      class="video__iframe"
      :src="`https://player.vimeo.com/video/${resourceId}`"
      frameborder="0"
      allow="autoplay; fullscreen"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script>
export default {
  props: {
    resourceId: String
  }
};
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
