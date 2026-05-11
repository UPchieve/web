<template>
  <!-- TODO: Just bring button-template into this component and
             make HyperlinkButton a variant.
  -->
  <button-template
    :variant="variant"
    :routeTo="routeTo"
    :class="buttonClasses"
    :showArrow="showArrow"
    :arrowDirection="arrowDirection"
    :buttonType="buttonType"
    :target="target"
    @click="(event) => $emit('click', event)"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
    <slot />
  </button-template>
</template>

<script>
import ButtonTemplate from './ButtonTemplate.vue'

export default {
  name: 'LargeButton',
  components: { ButtonTemplate },
  props: {
    primary: Boolean,
    reverse: Boolean,
    variant: {
      type: String,
      default: 'secondary',
    },
    routeTo: String,
    showArrow: {
      type: Boolean,
      default: true,
    },
    arrowDirection: {
      type: String,
      default: 'right',
    },
    buttonType: {
      type: String,
      default: 'button',
    },
    target: {
      type: String,
      default: '_self',
    },
  },
  computed: {
    buttonClasses() {
      if (this.primary) {
        // eslint-disable-next-line no-console
        console.warn(
          'LargeButton: `primary` is deprecated, use `variant` instead'
        )
      }
      const base = this.primary
        ? `LargeButton-primary`
        : `LargeButton-${this.variant}`
      return {
        [base]: true,
        [`${base}--reverse`]: this.reverse,
      }
    },
  },
  emits: ['click'],
}
</script>

<style lang="scss" scoped>
%LargeButton {
  border: 1px solid rgba(0, 0, 0, 0); // for consistent button size
  border-radius: 20px;
  padding: 9px 23px; // subtracted 1px for border
  display: inline-flex;
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

.LargeButton-primary-blue {
  @extend %LargeButton;

  background: $c-information-blue;
  color: white;

  &:hover {
    background: darken($c-information-blue, 5%);
    color: $c-background-grey;
  }

  &:disabled {
    background: $c-background-grey;
    color: $c-disabled-grey;
  }

  &--reverse {
    background: white;
    color: $c-information-blue;
  }
}

.LargeButton-outlined {
  @extend %LargeButton;

  background: white;
  border-color: $c-information-blue;
  color: $c-information-blue;

  &:hover,
  &:active {
    background: lighten($c-information-blue, 50%);
    color: $c-information-blue;
  }

  &:disabled {
    background: $c-background-grey;
    border-color: $c-disabled-grey;
    color: $c-disabled-grey;
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

.LargeButton-tertiary {
  @extend %LargeButton;

  background: white;
  color: $c-soft-black;

  &:hover {
    background: $c-background-grey;
  }

  &:disabled {
    background: $c-background-grey;
    border-color: $c-background-grey;
    color: $c-disabled-grey;
  }

  &--reverse {
    background: $c-background-grey;
  }
}

.LargeButton-danger {
  @extend %LargeButton;

  background: $c-error-red;
  color: white;

  &:hover {
    background: darken($c-error-red, 20%);
  }

  &:disabled {
    background: $c-background-grey;
    border-color: $c-background-grey;
    color: $c-disabled-grey;
  }

  &--reverse {
    background: white;
    border-color: $c-error-red;
    color: $c-error-red;

    &:hover {
      background: lighten($c-error-red, 55%);
      color: $c-error-red;
    }

    &:disabled {
      background: $c-background-grey;
      border-color: $c-background-grey;
      color: $c-disabled-grey;
    }
  }
}

.LargeButton-link-style {
  @extend %LargeButton;

  border: none;
  color: $c-soft-black;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:disabled {
    color: $c-disabled-grey;
    cursor: default;
  }
}
</style>
