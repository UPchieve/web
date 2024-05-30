<template>
  <div>
    <div
      class="survey-rate-container round-container"
      @click="handleRateClick"
      :class="{ 'selected-container': isSelected }"
    >
      <div class="round-text" :class="{ 'selected-text': isSelected }">
        {{ rating }}
      </div>
    </div>
    <div class="survey-rate-label" v-if="label">
      {{ label }}
    </div>
  </div>
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
@media only screen and (max-width: 660px) {
  .round-container {
    margin: 10px 15px;
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

.survey-rate-label {
  margin-top: -10px;
  text-align: center;
}
</style>
