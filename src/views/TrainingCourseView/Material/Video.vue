<template>
  <div class="video">
    <h4>Resource ID: {{ resourceId }}</h4>
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
}
</style>
