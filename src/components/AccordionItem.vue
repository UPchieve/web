<template>
  <div class="accordion-item" :class="{ 'accordion-item--open': isOpen }">
    <div
      class="accordion-item__title"
      :class="{ 'accordion-item__title--open': isOpen }"
      @click="toggle"
    >
      <div class="accordion-item__title-container">
        <span
          class="accordion-item__bullet"
          :class="{
            'accordion-item__bullet--open': isOpen,
            'accordion-item__bullet--large': buttonSize === 'large',
            'accordion-item__bullet--large-open':
              buttonSize === 'large' && isOpen
          }"
        ></span>
        <div class="accordion-item__labels">
          <span
            :class="{ 'accordion-item__labels-header': buttonSize === 'large' }"
            >{{ label }}</span
          >
          <span
            v-if="sublabel && isIntegratedMathDropDown"
            class="accordion-item__labels-sublabel"
          >
            Integrated math describes the style of mathematics education which
            integrates multiple strands of mathematics. The integrated sequence
            is meant to take math learning out of silos and teach students how
            to bridge connections among topics. Some US states (and therefore,
            some of UPchieve's school partners) only offer integrated math
            subjects.
            <span class="accordion-item__labels-sublabel--bold"
              >Don't be afraid to pick up an integrated math request</span
            >—as long as you've completed the underlying certifications, you'll
            be able to help!
          </span>
          <span v-else class="accordion-item__labels-sublabel">
            {{ sublabel }}
          </span>
        </div>
      </div>
      <div v-if="alertMessage" class="accordion-item__alert">
        <alert-icon class="accordion-item__alert--icon" />
        {{ alertMessage }}
      </div>
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
import AlertIcon from "@/assets/alert.svg";
export default {
  components: {
    AlertIcon
  },
  props: {
    label: {
      type: String,
      default: ""
    },
    sublabel: {
      type: String
    },
    buttonSize: {
      type: String
    },
    alertMessage: {
      type: String,
      default: ""
    }
  },
  computed: {
    isIntegratedMathDropDown() {
      return this.isOpen && this.label === "Integrated Math";
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

    @include breakpoint-below("large") {
      @include flex-container(column);
    }
  }

  &__title-container {
    @include flex-container(row);
  }

  &__labels {
    @include flex-container(column);
    text-align: left;
    color: $c-soft-black;

    &-header {
      @include font-category("heading");
      font-weight: 500;
    }

    &-sublabel {
      color: $c-secondary-grey;
      margin: 0.4em 0;

      &--bold {
        font-weight: 600;
      }
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
    flex-shrink: 0;

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

    &--large {
      height: 48px;
      width: 48px;

      &:after {
        height: 12px;
        width: 12px;
      }
    }

    &--open {
      background: $c-success-green;
      border-color: $c-success-green;
      color: #fff;

      &:after {
        border-color: #fff;
        transform: translateY(calc(-50% + 1px)) translateX(-50%) rotate(225deg);
      }
    }

    &--large-open {
      &:after {
        transform: translateY(calc(-33% + 1px)) translateX(-50%) rotate(225deg);
      }
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

  &__alert {
    @include flex-container(row, flex-start, center);
    margin-left: auto;
    color: $c-error-red;

    @include breakpoint-below("large") {
      flex-basis: 100%;
      margin-left: 60px;
    }

    &--icon {
      margin-right: 0.6em;
    }
  }
}
</style>
