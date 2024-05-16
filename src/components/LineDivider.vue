<template>
  <div class="uc-row items-center w-full break-line-container">
    <span class="break-line"></span>
    <p v-if="text" class="text">{{ text }}</p>
    <span class="break-line"></span>
  </div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
    },
  },
}
</script>

<style lang="scss">
.break-line-container {
  margin-top: 16px;
}

.break-line {
  background-color: $c-secondary-grey;
  flex-grow: 1;
  height: 1px;
}

.text {
  color: $c-secondary-grey;
  font-style: italic;
  padding: 0 10px;
  margin: 0;
  width: fit-content;
}
</style>
