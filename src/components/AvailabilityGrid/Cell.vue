<template>
  <div v-if="selectable" :class="cellClasses">
    <ClockIcon v-if="flagged" class="Cell-icon clock-icon" />
  </div>
  <div v-else :class="cellClasses">
    {{ content }}
  </div>
</template>

<script>
import ClockIcon from '@/assets/clock.svg'

export default {
  name: 'Cell',
  components: { ClockIcon },
  props: {
    content: {
      type: String,
      default: ''
    },
    selectable: {
      type: Boolean,
      default: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    flagged: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    cellClasses() {
      const base = `Cell-${this.selectable ? 'selectable' : 'unselectable'}`
      return {
        [base]: true,
        [`${base}--selected`]: this.selected
      }
    }
  }
}
</script>

<style lang="scss" scoped>
%Cell {
  @include font-category('body');
  border: 0.5px solid #cccccf;
  height: 62px;
  width: 108px;
  position: relative;
  background: none;
}

.Cell-icon {
  position: absolute;
  bottom: 5px;
  left: 5px;
}

.clock-icon {
  fill: currentColor;
  height: 20px;
  width: 20px;
}

.Cell-selectable {
  @extend %Cell;
  &--selected {
    background: $upchieve-green;
  }
}

.Cell-unselectable {
  @extend %Cell;

  display: flex;
  justify-content: center;
  align-items: flex-end;
}
</style>
