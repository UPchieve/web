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
  name: "LargeButton",
  components: { ButtonTemplate },
  props: {
    primary: Boolean,
    reverse: Boolean,
    routeTo: String,
    showArrow: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    buttonClasses() {
      const base = `LargeButton-${this.primary ? "primary" : "secondary"}`;
      return {
        [base]: true,
        [`${base}--reverse`]: this.reverse
      };
    }
  }
};
</script>

<style lang="scss" scoped>
%LargeButton {
  border: 1px solid rgba(0, 0, 0, 0); // for consistent button size
  border-radius: 20px;
  padding: 9px 23px; // subtracted 1px for border
}

.LargeButton-primary {
  @extend %LargeButton;

  background: $c-success-green;
  color: white;

  &:hover {
    background: darken($c-success-green, 5%);
    color: $c-background-grey;
  }

  &:disabled {
    background: $c-background-grey;
    color: $c-disabled-grey;
  }

  &--reverse {
    background: white;
    color: $c-success-green;
  }
}

.LargeButton-secondary {
  @extend %LargeButton;

  background: white;
  border-color: $c-border-grey;
  color: $c-soft-black;

  &:hover {
    border-color: $c-soft-black;
  }

  &:disabled {
    background: $c-background-grey;
    border-color: $c-background-grey;
    color: $c-disabled-grey;
  }

  &--reverse {
    border-color: white;
  }
}
</style>
