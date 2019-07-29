<template>
  <button :class="buttonClass">
    <div>
      <slot />
    </div>
    <upchieve-icon
      v-if="buttonStyle === 'primary'"
      icon="arrow"
      color="inherit"
    />
  </button>
</template>

<script>
import UpchieveIcon from "./UpchieveIcon";

const buttonStyles = {
  primary: true,
  secondary: true
}

export default {
  components: { UpchieveIcon },
  props: {
    buttonStyle: {
      type: String,
      default: "primary",
      validator: v => v in buttonStyles
    },
    reverse: Boolean
  },
  computed: {
    buttonClass() {
      const base = `LargeButton-${this.buttonStyle}`;
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
  @include font-category("button");
  @include flex-container(row, center, center);
  border: 1px solid rgba(0, 0, 0, 0); // for consistent button size
  border-radius: 20px;
  padding: 9px 23px; // subtracted 1px for border
}

.LargeButton-primary {
  @extend %LargeButton;
  @include child-spacing(left, 8px);

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
