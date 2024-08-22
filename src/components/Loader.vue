<template>
  <div :class="overlay && 'overlay'">
    <spinner :width="width" :height="height" />
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<script>
import Spinner from './Spinner.vue'
export default {
  components: { Spinner },
  props: {
    overlay: Boolean,
    height: { type: Number, default: 64 },
    width: { type: Number, default: 64 },
    message: String,
  },
}
</script>

<style lang="scss" scoped>
.overlay {
  @include flex-container(column, center, center);
  position: absolute;
  background-color: rgba($c-background-grey, 0.4);
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
