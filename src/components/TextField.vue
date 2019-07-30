<template>
  <div class="TextField">
    <label
      :for="id"
      class="TextField-title"
      :class="{ ['TextField-title--error']: showError }"
    >
      {{ title }}
    </label>

    <div v-if="$slots.default" class="TextField-description">
      <slot />
    </div>

    <input
      :id="id"
      type="text"
      class="TextField-input"
      :class="{['TextField-input--error']: showError}"
      :disabled="disabled"
      :placeholder="placeholder"
      :value="value"
      @input="$emit('input', $event.target.value)"
    >

    <div v-if="showError" class="TextField-error">{{ error }}</div>
  </div>
</template>

<script>
export default {
  props: {
    id: String,
    title: {
      type: String,
      required: true
    },
    disabled: Boolean,
    error: String,
    placeholder: String,
    value: String
  },
  computed: {
    showError() {
      return this.error && !this.disabled
    }
  }
}
</script>

<style lang="scss" scoped>
$spacing: 8px;

.TextField {
  @include flex-container(column, initial, flex-start);
  @include child-spacing(top, $spacing);
  max-width: 560px;
}

.TextField-title {
  @include font-category("subheading");
  color: $c-soft-black;
  margin-bottom: 0; // because bootstrap

  &--error {
    color: $c-error-red;
  }
}

.TextField-description {
  @include font-category("helper-text");
  color: $c-secondary-grey;
  margin-bottom: $spacing; // for 2x spacing between input

  a {
    color: $c-information-blue;
  }
}

.TextField-input {
  @include font-category("body");

  border: 1px solid $c-border-grey;
  border-radius: 4px;
  color: $c-soft-black;

  width: 100%;
  padding: 10px 16px;

  &::placeholder {
    color: $c-border-grey;
  }

  &:focus {
    border-color: $c-success-green;
  }

  &:disabled {
    background: $c-background-grey;
    color: $c-disabled-grey;
  }

  &--error {
    border-color: $c-error-red !important;
  }
}

.TextField-error {
  @include font-category("helper-text");
  color: $c-error-red;
}
</style>
