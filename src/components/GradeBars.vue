<template>
  <div class="bars">
    <div
      v-for="num in 10"
      class="bar"
      :class="computeBarFilledClass(num)"
      :key="num"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'GradeBars',
  props: {
    grade: { type: Number, required: true },
    minimumGrade: { type: Number, required: false, default: 0 },
  },
  methods: {
    isFilled(index) {
      return index <= this.numFilledSquares
    },
    computeBarFilledClass(num) {
      if (this.isFilled(num)) {
        if (this.grade >= 70) return 'bar-filled--primary'
        else return 'bar-filled--secondary'
      }
      return ''
    },
  },
  computed: {
    numFilledSquares() {
      if (this.grade < this.minimumGrade) return 0
      return Math.floor((this.grade - this.minimumGrade) / 10)
    },
  },
}
</script>

<style lang="scss" scoped>
.bars {
  @include flex-container(row);
}

.bar {
  width: 20%;
  height: 8px;
  margin: 0 0.1em;
  background-color: $c-background-grey;

  &-filled--primary {
    background-color: $c-success-green;
  }

  &-filled--secondary {
    background-color: #edca13;
  }
}
</style>
