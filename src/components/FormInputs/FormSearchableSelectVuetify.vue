<template>
  <v-autocomplete
    variant="outlined"
    :placeholder="props.placeholder"
    :items="props.options"
    :item-title="itemTitle"
    :item-value="itemValue"
    :model-value="props.modelValue || null"
    @update:model-value="
      (val) => {
        emit('update:modelValue', val)
        v$.modelValue.$touch()
      }
    "
    @blur="v$.value.modelValue.$touch()"
    :disabled="props.disabled"
    :name="props.name"
    :bg-color="props.bgColor"
    :error-messages="validationErrors"
    :error="hasError"
    :label="props.label"
  >
  </v-autocomplete>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

const props = defineProps({
  label: { type: String, required: false },
  name: { type: String, required: false },
  options: { type: Array, default: () => [] },
  optionTextField: { type: String, required: false },
  optionValueField: { type: String, required: false },
  modelValue: { type: [String, Array, null], default: null },
  isRequired: { type: Boolean, default: false },
  placeholder: { type: String, required: false, default: '' },
  disabled: { type: Boolean, required: false },
  bgColor: { type: String, default: 'white' },
})

const emit = defineEmits(['update:modelValue'])

const state = { modelValue: computed(() => props.modelValue || null) }

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

//If options are objects, we need optionTextField and optionValueField to know which fields to use for the text and value of the options.
// If options are strings, we can just use the option itself for both text and value.
const itemTitle = computed(() => props.optionTextField ?? 'title')
const itemValue = computed(() => props.optionValueField ?? 'id')
</script>
