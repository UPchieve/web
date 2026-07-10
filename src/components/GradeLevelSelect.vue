<script lang="ts" setup>
import { GRADES } from '@/consts'
import { getAcademicYear } from '@/utils/academic-year'
import FormSelect from '@/components/FormInputs/FormSelect.vue'

type GradeLevelSelectProps = {
  modelValue: any
  placeholder: string
  label: string
}
const emit = defineEmits(['update:modelValue'])
const props = withDefaults(defineProps<GradeLevelSelectProps>(), {
  placeholder: 'Grade level',
  label: `What grade will you be in during the ${getAcademicYear().asString} academic year?`,
})

function trimGradeLevel(gradeLevel: string) {
  return gradeLevel.split(' ')[0]
}
</script>

<template>
  <FormSelect
    data-testid="grade-level-selector"
    :value="props.modelValue"
    name="grade level"
    :options="GRADES"
    :placeholder="props.placeholder"
    :label="props.label"
    @update:modelValue="emit('update:modelValue', $event)"
    :reduce="trimGradeLevel"
  />
</template>

<style lang="scss" scoped></style>
