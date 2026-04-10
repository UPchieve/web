<template>
  <v-text-field
    :label="props.label"
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    @blur="v$.modelValue.$touch()"
    variant="outlined"
    :error-messages="validationErrors"
    :error="hasError"
    :placeholder="props.placeholder"
    :type="props.type"
    :disabled="props.readOnly"
    :name="props.name"
    :bg-color="props.bgColor"
  ></v-text-field>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import {
  required,
  minValue,
  maxValue,
  minLength,
  maxLength,
} from '@vuelidate/validators'

const props = defineProps({
  label: { type: String, required: false },
  modelValue: { type: String, required: true },
  isRequired: { type: Boolean, default: false },
  minVal: { type: Number, default: null },
  maxVal: { type: Number, default: null },
  minLen: { type: Number, default: null },
  maxLen: { type: Number, default: null },
  placeholder: { type: String, required: false },
  type: { type: String, default: 'text' },
  readOnly: { type: Boolean, default: false },
  name: { type: String, required: false },
  bgColor: { type: String, default: 'white' },
})

const emit = defineEmits(['update:modelValue'])

const state = reactive({ modelValue: computed(() => props.modelValue) })

const rules = {
  modelValue: {
    ...(props.isRequired && { required }),
    ...(props.minVal !== null && { minValue: minValue(props.minVal) }),
    ...(props.maxVal !== null && { maxValue: maxValue(props.maxVal) }),
    ...(props.minLen !== null && { minLength: minLength(props.minLen) }),
    ...(props.maxLen !== null && { maxLength: maxLength(props.maxLen) }),
  },
}
const v$ = useVuelidate(rules, state)

const validationErrors = computed(() =>
  v$.value.modelValue.$errors.map((e: any) => String(e.$message))
)

const hasError = computed(() => v$.value.modelValue.$error)
</script>
