<template>
  <div class="loading-container">
    <span>{{ message }}</span>
    <span class="loading-ellipsis" />
  </div>
</template>

<script>
export default {
  props: {
    message: { type: String, required: true }
  }
};
</script>

<style lang="scss" scoped>
.loading-container {
  display: inline-block;
  position: relative;
}

.loading-ellipsis {
  text-align: left;
  position: absolute;

  &:after {
    content: "...";
    display: inline-block;
    width: 25px;
    overflow: hidden;
    animation: 1.2s ellip infinite;
  }
}

@keyframes ellip {
  0% {
    width: 0px;
  }

  33% {
    width: 5px;
  }

  66% {
    width: 10px;
  }

  100% {
    width: 25px;
  }
}
</style>
