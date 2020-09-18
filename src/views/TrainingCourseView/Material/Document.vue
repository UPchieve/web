<template>
  <div class="document">
    <iframe
      :src="
        `https://docs.google.com/viewer?url=https://upc-training-materials.s3.us-east-2.amazonaws.com/${resourceId}.pdf&embedded=true`
      "
      frameborder="0"
      class="document__iframe"
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
.document {
  display: flex;
  flex-direction: column;

  &__iframe {
    width: 100%;
    height: 400px;
    border: none;
  }
}
</style>
