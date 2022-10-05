<template>
  <chip
    @click.native="handleChipClick"
    class="issue-reason"
    :class="{ 'selected-chip': isSelected }"
    :chipContent="label"
  />
</template>

<script>
import Chip from '../Chip.vue'
export default {
  name: 'SurveyChipOption',
  props: {
    label: {
      type: String,
      default: '',
      required: false,
    },
    isSelected: {
      type: Boolean,
      default: false,
      required: false,
    },
    responseId: {
      type: [String, Number],
      required: true,
    },
    questionId: {
      type: [String, Number],
      required: true,
    },
  },
  components: { Chip },
  methods: {
    handleChipClick() {
      this.$emit('chip-click', this.questionId, this.responseId)
    },
  },
}
</script>

<style lang="scss" scoped>
.issue-reason {
  color: black;
  border-color: $c-border-grey;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}
.selected-chip {
  border-color: $c-accent;
  background-color: $selected-green;
  color: $upchieve-green;
}
</style>
