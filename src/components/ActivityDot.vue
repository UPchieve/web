<template>
  <div class="activity-dot">
    <span v-if="total" class="activity-dot--total">{{ total }}</span>
  </div>
</template>

<script>
export default {
  name: 'ActivityDot',
  props: {
    total: {
      type: Number,
      required: false,
    },
  },
}
</script>

<style lang="scss" scoped>
.activity-dot {
  @include flex-container(row, center, center);
  width: 15px;
  height: 15px;
  background-color: $c-error-red;
  border-radius: 50%;
  text-align: center;

  &--total {
    color: $upchieve-white;
    font-size: 11px;
  }
}
</style>
