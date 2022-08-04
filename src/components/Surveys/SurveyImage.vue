<template>
  <div class="survey-image__container">
    <img
      :src="src"
      @click="handleImageClick"
      class="survey-image__image"
      :class="{
        'survey-image__image--not-selected': !isSelected,
      }"
    />
    <div
      v-if="label"
      class="survey-image__label"
      :class="{
        'survey-image__label--show': isSelected,
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
  },

  methods: {
    handleImageClick() {
      this.$emit('survey-image-click', this.responseId)
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

    @include breakpoint-above('small') {
      height: 50px;
      width: 50px;
    }

    &:hover {
      filter: grayscale(0);
      transform: scale(1.2);

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
  }

  &__label {
    margin-top: 1em;
    text-align: center;
    visibility: hidden;

    &--show {
      visibility: initial;
    }
  }
}
</style>
