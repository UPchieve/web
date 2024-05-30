<template>
  <div class="dropdown">
    <div class="dropdown__toggle" @click="toggleDropdown" :style="toggleStyles">
      <div v-if="header" class="dropdown__header">
        {{ header }}
      </div>
      <slot name="header"></slot>
      <right-caret
        class="dropdown__caret"
        :class="{ 'dropdown__caret--open': isOpen }"
      />
    </div>

    <div class="dropdown__content" v-if="isOpen">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
import RightCaret from '@/assets/right-caret.svg'

export default {
  components: {
    RightCaret,
  },
  emits: ['toggled'],
  props: {
    header: { type: String, required: false, default: '' },
    toggleStyles: {
      type: Object,
      default: () => ({}),
      required: false,
    },
  },
  data() {
    return {
      isOpen: false,
    }
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen
      this.$emit('toggled', this.isOpen)
    },
  },
}
</script>

<style lang="scss" scoped>
.dropdown {
  color: $c-soft-black;
  background-color: $upchieve-white;

  &__toggle {
    @include flex-container(row, space-between, center);
    padding-top: 0.6em;
    padding-bottom: 0.6em;
    cursor: pointer;
  }

  &__header {
    @include font-category('heading');
  }

  &__caret {
    &--open {
      transform: rotate(90deg);
    }
  }

  &__content:hover {
    cursor: initial;
  }
}
</style>
