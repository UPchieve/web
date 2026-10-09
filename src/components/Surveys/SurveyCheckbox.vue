<template>
  <FormCheckBox
    :id="id"
    :name="String(name)"
    :value="checkboxValue"
    :label="label"
    :model-value="!!checked"
    :is-required="false"
    variant="secondary"
    @update:model-value="handleCheckboxSelection"
  />
</template>

<script>
import FormCheckBox from '@/components/FormCheckBox.vue'

export default {
  components: { FormCheckBox },
  props: {
    id: {
      type: String,
      required: true,
    },
    checkboxValue: {
      types: [String, Number],
      required: true,
    },
    name: {
      type: [String, Number],
      required: true,
    },
    checked: {
      type: Boolean,
      default: false,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    questionId: {
      type: [String, Number],
      required: true,
    },
    responseId: {
      type: [String, Number],
      required: true,
    },
  },
  emits: ['survey-checkbox-input'],
  methods: {
    handleCheckboxSelection() {
      this.$emit('survey-checkbox-input', this.questionId, this.responseId, '')
    },
  },
}
</script>

<style lang="scss" scoped>
:deep(.checkbox-label) {
  font-weight: 400;
  font-size: 16px;
}

:deep(input[type='checkbox']) {
  background-color: $upchieve-white;
}
</style>
