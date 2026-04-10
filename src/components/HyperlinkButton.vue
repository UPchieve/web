<template>
  <button-template
    :primary="primary"
    :routeTo="routeTo"
    :class="buttonClasses"
    :showArrow="showArrow"
    :buttonType="buttonType"
    :bold="bold"
    :target="target"
    @click="$emit('click')"
  >
    <slot />
  </button-template>
</template>

<script>
import ButtonTemplate from './ButtonTemplate.vue'

export default {
  components: { ButtonTemplate },
  props: {
    primary: Boolean,
    dark: Boolean,
    reverse: Boolean,
    routeTo: String,
    bold: { type: Boolean, default: false },
    showArrow: { type: Boolean, default: true },
    buttonType: {
      type: String,
      default: 'button',
    },
    target: {
      type: String,
      default: '_blank',
    },
  },
  computed: {
    buttonClasses() {
      return {
        HyperlinkButton: true,
        'HyperlinkButton--dark': this.dark,
        'HyperlinkButton--reverse': this.reverse,
      }
    },
  },
  emits: ['click'],
}
</script>

<style lang="scss" scoped>
.HyperlinkButton {
  background: none;
  border: none;
  color: $c-success-green;

  &:disabled {
    color: $c-disabled-grey;
  }

  &--dark {
    color: $c-soft-black;
  }

  &--reverse {
    color: white;
  }
}
</style>
