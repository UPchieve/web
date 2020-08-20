<template>
  <div class="document">
    <iframe
      :src="
        `https://docs.google.com/document/d/e/${resourceId}/pub?embedded=true`
      "
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
  iframe {
    width: 100%;
    height: 400px;
    border: solid $c-border-grey 1px;
  }
}
</style>
