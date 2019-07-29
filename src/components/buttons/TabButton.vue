<template>
  <button-template :routeTo="routeTo" :disabled="active" :class="buttonClasses">
    <slot />
  </button-template>
</template>

<script>
import ButtonTemplate from './ButtonTemplate';

export default {
  components: {
    ButtonTemplate
  },
  props: {
    active: Boolean,
    routeTo: String
  },
  computed: {
    buttonClasses() {
      return {
        TabButton: true,
        "TabButton--active": this.active
      };
    }
  }
};
</script>

<style lang="scss" scoped>
.TabButton {
  $padding: 8px;
  $border-size: 1px;

  color: $c-secondary-grey;
  padding-bottom: $padding + $border-size;

  &--active {
    border-bottom: $border-size solid $c-success-green;
    color: $c-success-green;
    padding-bottom: $padding;
  }
}
</style>
