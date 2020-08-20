<template>
  <div class="slideshow">
    <iframe
      :src="
        `https://docs.google.com/presentation/d/e/${resourceId}/embed?start=true&loop=false&delayms=30000`
      "
      frameborder="0"
      width="auto"
      height="569"
      allowfullscreen="true"
      mozallowfullscreen="true"
      webkitallowfullscreen="true"
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
.slideshow {
  iframe {
    width: 100%;
    height: 500px;
  }
}
</style>
