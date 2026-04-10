<template>
  <v-select
    variant="outlined"
    :label="props.label"
    :items="props.options"
    :item-title="itemTitle"
    :item-value="itemValue"
    :model-value="props.modelValue"
    @update:model-value="
      (val) => {
        emit('update:modelValue', val)
        v$.modelValue.$touch()
      }
    "
    :multiple="props.multiple"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :name="props.name"
    return-object
    :chips="props.chips"
    :error-messages="validationErrors"
    :error="hasError"
    :bg-color="props.bgColor"
  >
  </v-select>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

const props = defineProps({
  label: { type: String, required: false },
  name: { type: String, required: false },
  multiple: { type: Boolean, default: false },
  options: { type: Array, default: () => [] },
  optionTextField: { type: String, required: false },
  optionValueField: { type: String, required: false },
  modelValue: { type: [String, Array], required: true },
  isRequired: { type: Boolean, default: false },
  placeholder: { type: String, required: false, default: '' },
  disabled: { type: Boolean, required: false },
  chips: { type: Boolean, default: false },
  bgColor: { type: String, default: 'white' },
})

const emit = defineEmits(['update:modelValue'])

const state = reactive({ modelValue: computed(() => props.modelValue) })

const rules = {
  modelValue: {
    ...(props.isRequired && { required }),
  },
}
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
