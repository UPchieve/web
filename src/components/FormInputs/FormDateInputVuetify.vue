<template>
  <div class="date-picker-wrapper w-full" v-click-outside="closeCalendar">
    <v-text-field
      variant="outlined"
      :label="props.label"
      :model-value="displayValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :name="props.name"
      :bg-color="props.bgColor"
      readonly
      :error-messages="validationErrors"
      :error="hasError"
      @click="toggleCalendar"
    >
      <template #append-inner>
        <Calendar class="calendar-icon" />
      </template>
    </v-text-field>
    <v-date-picker
      v-if="isCalendarOpen"
      :model-value="props.modelValue"
      @update:model-value="onDateSelected"
      :bg-color="props.bgColor"
      :min="props.min"
      :max="props.max"
      class="date-picker-dropdown"
      hide-header
    >
    </v-date-picker>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import Calendar from '@/assets/calendar.svg'
import { required } from '@vuelidate/validators'
import useVuelidate from '@vuelidate/core'

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  label: { type: String, required: false },
  modelValue: { type: String, required: true },
  isRequired: { type: Boolean, default: false },
  placeholder: { type: String, required: false },
  name: { type: String, required: false },
  bgColor: { type: String, default: 'white' },
  disabled: { type: Boolean, required: false },
  min: { type: Date, required: false },
  max: { type: Date, required: false },
})

const isCalendarOpen = ref(false)

function toggleCalendar() {
  if (!props.disabled) {
    isCalendarOpen.value = !isCalendarOpen.value
  }
}

function onDateSelected(date: string) {
  emit('update:modelValue', date)
  isCalendarOpen.value = false
}

function closeCalendar() {
  isCalendarOpen.value = false
  v$.value.modelValue.$touch()
}

const dateValue = computed(() => {
  if (!props.modelValue) return null
  const [year, month, day] = props.modelValue.split('-').map(Number)
  return new Date(year, month - 1, day)
})

const displayValue = computed(() => {
  if (!dateValue.value) return props.placeholder || ''
  return dateValue.value.toLocaleDateString()
})

const state = reactive({ modelValue: computed(() => props.modelValue) })

const rules = computed(() => ({
  modelValue: {
    ...(props.isRequired && { required }),
  },
}))

const v$ = useVuelidate(rules, state)

const validationErrors = computed(() =>
  v$.value.modelValue.$errors.map((e: any) => String(e.$message))
)

const hasError = computed(() => v$.value.modelValue.$error)
</script>

<style lang="scss" scoped>
:deep(.v-field__input) {
  text-align: center;
}

.date-picker-wrapper {
  position: relative;
}

.date-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
