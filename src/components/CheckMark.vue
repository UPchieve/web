<template>
  <div class="check-mark" :class="{ 'check-mark--checked': checked }">
    <check-icon class="check-mark__icon" />
  </div>
</template>

<script>
import CheckIcon from '@/assets/check.svg'

export default {
  components: {
    CheckIcon
  },
  props: {
    checked: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss" scoped>
.check-mark {
  height: 50px;
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: solid 2px $c-border-grey;
  border-radius: 50px;

  &--checked {
    border-color: $c-success-green;

    .check-mark__icon {
      filter: none;
    }
  }

  &__icon {
    filter: brightness(0) saturate(100%) invert(84%) sepia(5%) saturate(1065%)
      hue-rotate(189deg) brightness(110%) contrast(87%);
  }
}
</style>
