<template>
  <div>
    <ul class="feedback__checkbox-list">
      <li
        class="feedback__checkbox-list-item"
        v-for="(option, index) in options"
        :key="`${id}-${index}`"
      >
        <input
          type="checkbox"
          :id="`${id}-${index}`"
          :name="id"
          :value="index + 1"
          class="feedback__checkbox-input feedback__checkbox-input uc-form-input"
          v-model="selected"
        />
        <label class="feedback__checkbox-label" :for="`${id}-${index}`">
          <span class="feedback__checkbox-option">
            {{ option }}
          </span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'FeedbackCheckbox',
  model: { prop: 'selectedOptions' },
  props: {
    id: {
      type: String,
      required: true
    },
    options: Array,
    value: String,
    selectedOptions: Array
  },
  computed: {
    checked() {
      return this.selectedOptions.includes(this.value)
    },
    selected: {
      get() {
        return this.selectedOptions
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  list-style-type: none;
  padding-inline-start: 0;
}

label {
  font-weight: 400;
  @include font-category('helper-text');
}

.feedback {
  &__checkbox-list {
    margin-top: 1.4em;

    @include breakpoint-above('medium') {
      margin-left: 4em;
    }
  }

  &__checkbox-list-item {
    margin-bottom: 0.8em;
  }

  &__checkbox-label {
    display: inline-flex;
    align-items: center;
  }

  &__checkbox-option {
    padding-left: 0.5em;
  }

  &__checkbox-input {
    display: none;
  }

  &__checkbox-input + label:before {
    content: '';
    display: inline-block;
    width: 24px;
    height: 24px;
    min-width: 24px;
    min-height: 24px;
    padding: 3px;
    background-clip: content-box;
    border: 1px solid $c-secondary-grey;
  }

  &__checkbox-input:checked + label:before {
    background-color: $c-success-green;
    border: 1px solid $c-success-green;
  }

  &__checkbox-input {
    margin: 0;
  }
}
</style>
