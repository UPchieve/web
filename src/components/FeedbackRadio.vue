<template>
  <div>
    <ul class="feedback__radio-list--row" v-if="direction === 'row'">
      <li
        class="feedback__radio-list-item--row"
        v-for="(option, index) in options"
        :key="`${id}-${index}`"
      >
        <input
          type="radio"
          :id="`${id}-${index}`"
          :name="id"
          :value="index + 1"
          class="feedback__radio-input uc-form-input"
          @change="$emit('change', Number($event.target.value))"
        />
        <label class="feedback__radio-label--row" :for="`${id}-${index}`">
          <span class="feedback__radio-option-num--row">{{ index + 1 }}</span>
          <p class="feedback__radio-option--row">{{ option }}</p>
        </label>
      </li>
    </ul>

    <ul class="feedback__radio-list" v-else>
      <li
        class="feedback__radio-list-item"
        v-for="(option, index) in options"
        :key="`${id}-${index}`"
      >
        <input
          type="radio"
          :id="`${id}-${index}`"
          :name="id"
          :value="index + 1"
          class="feedback__radio-input feedback__radio-input uc-form-input"
          @change="$emit('change', Number($event.target.value))"
        />
        <label class="feedback__radio-label" :for="`${id}-${index}`">
          <span class="feedback__radio-option">
            {{ option }}
          </span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'FeedbackRadio',
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    id: {
      type: String,
      required: true
    },
    options: Array,
    direction: {
      type: String,
      default: 'column'
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
  &__radio-list--row {
    display: flex;
    flex-direction: column;
    margin-top: 1.4em;

    @include breakpoint-above('medium') {
      flex-direction: row;
      justify-content: space-around;
    }
  }

  &__radio-list {
    margin-top: 1.4em;

    @include breakpoint-above('medium') {
      margin-left: 4em;
    }
  }

  &__radio-list-item--row {
    display: flex;
  }

  &__radio-list-item {
    margin-bottom: 0.8em;
  }

  &__radio-label--row {
    display: flex;
    align-items: center;
    margin-bottom: 1em;

    @include breakpoint-above('medium') {
      flex-direction: column;
      align-items: center;
      margin-bottom: 0;
      width: 100px;
    }
  }

  &__radio-label {
    display: inline-flex;
    align-items: center;
  }

  &__radio-option--row {
    text-align: left;
    margin: 0;

    @include breakpoint-above('medium') {
      text-align: center;
    }

    &-num {
      padding-left: 0.5em;
      padding-right: 1em;

      @include breakpoint-above('medium') {
        padding: 0;
      }
    }
  }

  &__radio-option {
    padding-left: 0.5em;
  }

  // styles to change the radio button
  &__radio-input {
    display: none;
  }

  &__radio-input + label:before {
    content: '';
    display: inline-block;
    width: 24px;
    height: 24px;
    min-width: 24px;
    min-height: 24px;
    padding: 3px;
    background-clip: content-box;
    border: 1px solid $c-secondary-grey;
    border-radius: 50%;
  }

  &__radio-input:checked + label:before {
    background-color: $c-success-green;
    border: 1px solid $c-success-green;
  }

  &__radio-input {
    margin: 0;
  }
}
</style>
