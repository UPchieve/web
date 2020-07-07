<template>
  <div
    class="account-action"
    :class="{
      'account-action--progress': status === 'PROGRESS',
      'account-action--pending': status === 'PENDING',
      'account-action--completed': status === 'COMPLETED',
      'account-action--error': status === 'ERROR'
    }"
  >
    <div class="account-action__icon-container">
      <check-icon v-if="status === 'COMPLETED'" />
      <component v-else :is="icon"></component>
    </div>
    <div class="account-action__body">
      <div class="account-action__title">{{ title }}</div>
      <div class="account-action__subtitle">{{ subtitle }}</div>
    </div>
    <right-caret class="account-action__caret" />
  </div>
</template>

<script>
import RightCaret from "@/assets/right-caret.svg";
import CheckIcon from "@/assets/check.svg";

export default {
  name: "account-action",
  components: {
    RightCaret,
    CheckIcon
  },
  props: {
    title: String,
    subtitle: String,
    status: String,
    icon: Object
  }
};
</script>

<style lang="scss" scoped>
.account-action {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 20px;
  padding: 12px;
  cursor: pointer;

  &__icon-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 60px;
    width: 60px;
    border-radius: 50%;
    border: 2px solid $c-border-grey;
  }

  &__body {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-left: 1em;
  }

  &__title {
    font-size: 18px;
    font-weight: 400;
  }

  &__subtitle {
    color: $c-secondary-grey;
  }

  &__caret {
    margin-right: 7px;
  }

  &--progress {
    .account-action__icon-container {
      border-color: $c-information-blue;
    }

    .account-action__subtitle {
      color: $c-information-blue;
    }
  }

  &--pending {
    .account-action__icon-container {
      border-color: $c-warning-orange;
    }

    .account-action__subtitle {
      color: $c-warning-orange;
    }
  }

  &--completed {
    .account-action__icon-container {
      border-color: $c-success-green;
    }

    .account-action__subtitle {
      color: $c-success-green;
    }
  }

  &--error {
    .account-action__icon-container {
      border-color: $c-error-red;
    }

    .account-action__subtitle {
      color: $c-error-red;
    }
  }
}
</style>
