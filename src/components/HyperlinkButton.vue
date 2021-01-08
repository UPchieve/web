<template>
  <button-template
    :primary="primary"
    :routeTo="routeTo"
    :class="buttonClasses"
    :showArrow="showArrow"
  >
    <slot />
  </button-template>
</template>

<script>
import ButtonTemplate from "./ButtonTemplate";

export default {
  components: { ButtonTemplate },
  props: {
    primary: Boolean,
    dark: Boolean,
    reverse: Boolean,
    routeTo: String,
    showArrow: { type: Boolean, default: true }
  },
  computed: {
    buttonClasses() {
      return {
        HyperlinkButton: true,
        "HyperlinkButton--dark": this.dark,
        "HyperlinkButton--reverse": this.reverse
      };
    }
  }
};
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
