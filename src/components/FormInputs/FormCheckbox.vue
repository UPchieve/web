<template>
  <v-checkbox
    v-model="internalValue"
    :label="props.label"
    :id="props.name"
    :name="props.name"
    color="uc-accent"
    hide-details="auto"
    :error="hasError"
    :error-messages="validationErrors"
  />
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs } from '@vuelidate/validators'

const props = defineProps({
  label: { type: String, required: false },
  modelValue: { type: Boolean, default: false },
  isRequired: { type: Boolean, default: false },
  name: { type: String, required: false },
})

const emit = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const state = reactive({ modelValue: computed(() => props.modelValue) })

const rules = {
  modelValue: {
    ...(props.isRequired && {
      required,
      sameAs: sameAs(true),
    }),
  },
}

const v$ = useVuelidate(rules, state)

const validationErrors = computed(() =>
  v$.value.modelValue.$errors.map((e: any) => String(e.$message))
)

const hasError = computed(() => v$.value.modelValue.$error)
</script>

<style lang="scss" scoped>
:deep(.v-label) {
  margin-bottom: 0px;
}
</style>
