<template>
  <div class="DropdownList">
    <label
      :for="id"
      class="DropdownList-label"
      :class="{ 'DropdownList-label--disabled': disabled }"
      >{{ label }}</label
    >

    <select
      :id="id"
      class="DropdownList-select"
      :disabled="disabled"
      :value="value"
      @input="$emit('input', $event.target.value)"
    >
      <option v-if="disabledOption" selected disabled value>{{
        disabledOption
      }}</option>
      <option v-for="(option, index) in options" :key="index" :value="option">{{
        optionDisplay[option] || option
      }}</option>
    </select>
  </div>
</template>

<script>
export default {
  props: {
    id: String,
    label: String,
    value: String,
    disabled: Boolean,
    disabledOption: String,
    options: Array,
    optionDisplay: Object
  }
}
</script>

<style lang="scss" scoped>
.DropdownList {
  @include flex-container(column, initial, flex-start);
  color: $c-soft-black;
  max-width: 560px;
}

.DropdownList-label {
  @include font-category('subheading');
  margin-bottom: 16px;

  &--disabled {
    color: $c-disabled-grey;
  }
}

.DropdownList-select {
  @include font-category('body');

  background: white;
  border: 1px solid $c-border-grey;
  border-radius: 4px;
  width: 100%;
  padding: 10px 16px;

  &:disabled {
    color: $c-disabled-grey;
  }
}
</style>
