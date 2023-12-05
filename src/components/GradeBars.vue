<template>
  <div class="bars">
    <div
      v-for="num in 5"
      class="bar"
      :class="isFilled(num) && 'bar--filled'"
      :key="num"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'GradeBars',
  props: {
    grade: Number,
  },
  methods: {
    isFilled(index) {
      return index <= this.numFilledSquares
    },
  },

  computed: {
    numFilledSquares() {
      if (this.grade < 50) return 1
      return Math.floor((this.grade - 50) / 10) + 1
    },
  },
}
</script>

<style lang="scss" scoped>
.bars {
  @include flex-container(row);
}

.bar {
  width: 20px;
  height: 20px;
  margin: 0 0.1em;
  background-color: $c-background-grey;

  &--filled {
    background-color: $c-success-green;
  }
}
</style>
