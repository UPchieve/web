<template>
  <div :class="overlay && 'overlay'">
    <div class="loader">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    overlay: Boolean
  }
};
</script>

<style lang="scss" scoped>
.loader {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
  opacity: 1;

  & div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 64px;
    height: 64px;
    margin: 8px;
    border: 8px solid $c-information-blue;
    border-radius: 50%;
    animation: ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: $c-information-blue transparent transparent transparent;
  }

  & div:nth-child(1) {
    animation-delay: -0.45s;
  }

  & div:nth-child(2) {
    animation-delay: -0.3s;
  }

  & div:nth-child(3) {
    animation-delay: -0.15s;
  }
}

@keyframes ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.overlay {
  @include flex-container(row, center, center);
  position: absolute;
  background-color: rgba($c-background-grey, 0.4);
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
