<template>
  <div class="accordion-item" :class="{ 'accordion-item--open': isOpen }">
    <div
      class="accordion-item__title"
      :class="{ 'accordion-item__title--open': isOpen }"
      @click="toggle"
    >
      <span
        class="accordion-item__bullet"
        :class="{ 'accordion-item__bullet--open': isOpen }"
      ></span>
      <span>{{ label }}</span>
    </div>
    <div
      class="accordion-item__content"
      :class="{ 'accordion-item__content--open': isOpen }"
    >
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      isOpen: false
    };
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    }
  }
};
</script>

<style lang="scss" scoped>
.accordion-item {
  overflow: hidden;

  &:not(:last-of-type) {
    border-bottom: 1px solid $c-border-grey;
  }

  &__title {
    font-size: 16px;
    padding: 24px 0;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;

    &--open {
      color: $c-success-green;
    }
  }

  &__bullet {
    margin-right: 15px;
    position: relative;
    display: inline-block;
    width: 24px;
    height: 24px;
    border: solid 1px $c-soft-black;
    border-radius: 100%;
    text-align: center;
    padding-top: 4px;

    &--open {
      background: $c-success-green;
      border-color: $c-success-green;
      color: #fff;

      &:after {
        border-color: #fff !important;
        transform: translateY(calc(-50% + 1px)) translateX(-50%) rotate(225deg) !important;
      }
    }

    &:after {
      content: "";
      position: absolute;
      display: block;
      height: 6px;
      width: 6px;
      top: calc(50%);
      left: 50%;
      transform: translateY(calc(-50% - 1px)) translateX(-50%) rotate(45deg);
      border: solid 1px #000;
      border-left: none;
      border-top: none;
    }
  }

  &__content {
    padding: 0;
    height: 0;
    font-size: 14px;

    &--open {
      padding: 0 20px 25px 39px;
      height: auto;
    }

    p:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
