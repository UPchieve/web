<template>
  <div class="RadioButton">
    <input
      v-bind="$attrs"
      :id="id"
      type="radio"
      class="RadioButton-input"
      :disabled="disabled"
      :value="checkedValue"
      @input="$emit('input', $event.target.value)"
    />

    <label
      :for="id"
      :class="{
        'RadioButton-label': true,
        'RadioButton-label--checked': checked,
        'RadioButton-label--disabled': disabled
      }"
    >
      <slot/>
    </label>
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    id: {
      type: String,
      required: true
    },
    checkedValue: {
      type: String,
      required: true
    },
    disabled: Boolean
  },
  computed: {
    checked() {
      return this.$attrs.value === this.checkedValue
    }
  }
}
</script>

<style lang="scss" scoped>
.RadioButton {
  @include flex-container(row, center, center);
}

.RadioButton-label {
  @include font-category("body");
  margin: 0 0 0 8px;

  &--checked {
    color: $c-success-green;
  }

  &--disabled {
    color: $c-disabled-grey;
  }
}

.RadioButton-input {
  $size: 24px;

  appearance: none;
  margin: 0; // bootstrap fix
  width: $size;
  height: $size;

  &:before { // outside circle
    content: '';
    border: 1px solid $c-border-grey;
    border-radius: 100%;
    position: absolute;
    width: $size;
    height: $size;
  }

  &:checked {
    outline: none;

    &:before {
      border-color: $c-success-green;
    }

    &:after { // inner circle
      $inset: 3px;
      content: '';
      background: $c-success-green;
      border-radius: 100%;
      position: absolute;
      width: $size - ($inset * 2);
      height: $size - ($inset * 2);
      margin: $inset 0 0 $inset;
    }
  }

  &:disabled {
    &:before {
      border-color: $c-disabled-grey;
    }

    &:after {
      background: $c-disabled-grey;
    }
  }
}
</style>
