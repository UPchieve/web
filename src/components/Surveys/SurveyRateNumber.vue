<template>
  <label class="survey-rate">
    <input
      class="survey-rate-input"
      type="radio"
      :name="`survey-rate-${questionId}`"
      :checked="isSelected"
      :disabled="readOnly"
      @change="handleRateClick"
    />
    <span
      class="survey-rate-container round-container"
      :class="{ 'selected-container': isSelected }"
    >
      <span class="round-text" :class="{ 'selected-text': isSelected }">
        {{ rating }}
      </span>
    </span>
    <span class="survey-rate-label" v-if="label">
      {{ label }}
    </span>
  </label>
</template>

<script>
export default {
  name: 'SurveyRateNumber',
  props: {
    rating: {
      type: String,
      required: true,
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
    label: {
      type: String,
      default: '',
      required: false,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['survey-rate-click'],
  methods: {
    handleRateClick() {
      this.$emit('survey-rate-click', this.questionId, this.responseId)
    },
  },
}
</script>
<style lang="scss" scoped>
.survey-rate {
  display: block;
  position: relative;
  // Undoes Bootstrap reboot's margin under every label.
  margin-bottom: 0;
}

.survey-rate-input {
  @include visually-hidden;
}

.survey-rate-input:focus-visible + .round-container {
  outline: 2px solid $c-information-blue;
  outline-offset: 2px;
}

@media only screen and (max-width: 660px) {
  // Five equal columns keep the scale on one row on the narrowest phones.
  .survey-rate {
    flex: 1 1 0;
    min-width: 0;
  }
  .round-container {
    margin: 10px auto;
    height: 30px;
    width: 30px;
  }
  .round-text {
    font-size: 15px;
    margin-top: 4px;
  }
  .survey-rate-label {
    font-size: 15px;
  }
}

// Below the narrowest common phone, the feedback page's row is too narrow for
// three labels at full size.
@media only screen and (max-width: 383px) {
  .survey-rate-label {
    font-size: 12px;
  }
}

@media only screen and (min-width: 661px) {
  .round-container {
    margin: 20px 20px;
    height: 60px;
    width: 60px;
  }
  .round-text {
    font-size: 18pt;
    margin-top: 10px;
  }
}

.round-container {
  border: solid 1px $c-border-grey;
  justify-content: center;
  align-items: center;
  align-self: flex-start;
  border-radius: 100%;
  padding: 0 0;
  display: inherit;
}
.round-text {
  display: block;
  color: $c-secondary-grey;
  text-align: center;
  cursor: pointer;
}
.selected-container {
  border-color: $c-success-green;
  background-color: $selected-green;
}
.selected-text {
  color: $c-success-green;
}

.disabled-container {
  background-color: $c-background-grey;
}

// Only 1, 3 and 5 have labels, so a long one spills over its unlabeled
// neighbors. Flex, not text-align, keeps it centered as it does.
.survey-rate-label {
  @include flex-container(row, center);
  margin-top: -10px;
  white-space: nowrap;
}
</style>
