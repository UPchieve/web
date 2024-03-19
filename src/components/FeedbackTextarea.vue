<template>
  <textarea
    class="feedback__textarea"
    @input="$emit('input', $event.target.value)"
  ></textarea>
</template>

<script>
export default {
  name: 'FeedbackTextarea',
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  model: {
    prop: 'value',
    event: 'input',
  },
}
</script>

<style lang="scss" scoped>
.feedback {
  &__textarea {
    width: 100%;
    height: 120px;
    border: 1px solid $c-border-grey;
    border-radius: 5px;
    padding: 1em;
    resize: none;
    &:focus {
      outline: none;
      border-color: $c-success-green;
    }
  }
}
</style>
