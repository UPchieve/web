<template>
  <div
    class="survey-image__container"
    @click="handleImageClick"
    role="button"
    :disabled="readOnly"
  >
    <img
      :src="src"
      class="survey-image__image"
      alt="image showing answer option, see label that appears when selected"
      :class="{
        'survey-image__image--not-selected': !isSelected,
        'survey-image__image--read-only': readOnly,
        'survey-image__image--not-selected-read-only': readOnly && !isSelected,
      }"
    />
    <div
      v-if="label"
      class="survey-image__label"
      :class="{
        'survey-image__label--show': isSelected,
        'survey-image__label--read-only': readOnly,
      }"
    >
      {{ label }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    src: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: '',
      required: false,
    },
    isSelected: {
      type: Boolean,
      required: true,
    },
    responseId: {
      type: [String, Number],
      required: true,
    },
    questionId: {
      type: [String, Number],
      required: true,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['survey-image-click'],
  methods: {
    handleImageClick() {
      if (this.readOnly) return
      this.$emit('survey-image-click', this.questionId, this.responseId)
    },
  },
}
</script>

<style lang="scss" scoped>
.survey-image {
  &__container {
    @include flex-container(column, center, center);
  }

  &__image {
    cursor: pointer;
    transition: transform 0.2s;
    height: 38px;
    width: 38px;

    @media only screen and (max-width: 660px) {
      margin: 10px 15px;
      height: 20px;
      width: 20px;
    }

    @media only screen and (min-width: 661px) {
      margin: 20px 20px;
      height: 50px;
      width: 50px;
    }

    &:hover {
      filter: grayscale(0);
      transform: scale(1.1);

      // show the label for the image when hovering over the image
      & + .survey-image__label {
        visibility: initial;
      }
    }

    &:active {
      filter: grayscale(0);
      transform: scale(0.9);
    }

    &--not-selected {
      filter: grayscale(1);
    }

    &--read-only {
      &:hover {
        filter: initial;
        transform: initial;
        cursor: initial;

        & + .survey-image__label {
          visibility: hidden;
        }
      }
    }

    &--not-selected-read-only {
      &:hover {
        filter: grayscale(1);
      }
    }
  }

  &__label {
    margin-top: 1em;
    text-align: center;
    visibility: hidden;

    &--show {
      visibility: initial;
    }

    &--read-only {
      visibility: hidden;
    }
  }
}
</style>
