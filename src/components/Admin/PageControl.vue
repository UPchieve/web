<template>
  <div class="page-control">
    <div class="page-control__left">
      <div
        v-if="!isFirstPage"
        class="page-control__button"
        @click="previousPage"
      >
        ← Previous
      </div>
    </div>
    <div class="page-control__center">
      <div v-if="showPageNumber" class="page-control__title">
        Page {{ page }}
      </div>
    </div>
    <div class="page-control__right">
      <div v-if="!isLastPage" class="page-control__button" @click="nextPage">
        Next →
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageControl',

  props: {
    page: Number,
    isFirstPage: Boolean,
    isLastPage: Boolean,
    showPageNumber: { type: Boolean, default: true }
  },

  methods: {
    nextPage() {
      this.$emit('nextPage')
    },
    previousPage() {
      this.$emit('previousPage')
    }
  }
}
</script>

<style lang="scss" scoped>
.page-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 5px;

  @include breakpoint-above('medium') {
    padding: 15px 25px;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
  }

  &__left,
  &__center,
  &__right {
    flex-basis: 33.33%;
  }

  &__left {
    text-align: left;
  }

  &__right {
    text-align: right;
  }

  &__button {
    display: inline-flex;
    color: #417db1;
    border-radius: 20px;
    padding: 5px 15px;
    cursor: pointer;

    &:hover {
      background: #f7fcfe;
    }
  }
}
</style>
