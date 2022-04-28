<template>
  <div class="CheckBox">
    <input
      v-bind="$attrs"
      class="CheckBox-input"
      type="checkbox"
      :id="id"
      :checked="checked"
      @change="$emit('change', $event.target.checked)"
    />

    <label
      class="CheckBox-label"
      :class="{ 'CheckBox-label--checked': checked }"
      :for="id"
    >
      <slot />
    </label>
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  model: {
    prop: 'checked',
    event: 'change'
  },
  props: {
    checked: Boolean,
    id: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
.CheckBox {
  @include flex-container(row, flex-start, baseline);
}

.CheckBox-label {
  @include font-category('body');
  color: $c-soft-black;
  margin: 0 0 0 12px;
}

.CheckBox-input {
  @include flex-container(row, center, center);
  $size: 16px;

  appearance: none;
  border: 1px solid $c-border-grey;
  border-radius: 2px;
  box-shadow: none;
  font-size: 12px;
  width: $size;
  height: $size;
  margin: 0; // bootstrap fix

  &:after {
    content: '✓';
    opacity: 0;
  }

  &:checked {
    background: $c-success-green;
    border-color: $c-success-green;
    color: white;

    &:after {
      opacity: 1;
    }
  }

  &:disabled {
    background: $c-background-grey;
    border-color: $c-background-grey;
    color: $c-secondary-grey;
  }
}
</style>
