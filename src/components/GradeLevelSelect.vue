<script lang="ts" setup>
import { GRADES } from '@/consts'
import { getAcademicYear } from '@/utils/academic-year'
import FormSelect from '@/components/FormInputs/FormSelect.vue'

const academicYear = getAcademicYear()
const emit = defineEmits(['update:modelValue'])
const props = defineProps(['modelValue'])

function trimGradeLevel(gradeLevel: string) {
  return gradeLevel.split(' ')[0]
}
</script>

<template>
  <FormSelect
    :value="props.modelValue"
    name="grade level"
    :options="GRADES"
    placeholder="Grade level"
    :label="`What grade will you be in during the ${academicYear.asString} academic year?`"
    @update:modelValue="emit('update:modelValue', $event)"
    :reduce="trimGradeLevel"
  />
</template>

<style lang="scss" scoped></style>
