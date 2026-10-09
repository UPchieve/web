<template>
  <div class="uc-form-element w-full" :class="$attrs.class">
    <div class="uc-row justify-between">
      <label :for="inputId()" :class="{ error: errorMessage }">
        <slot name="label">{{ label }}</slot>
      </label>
      <div v-if="errorMessage" class="error-caption">
        {{ errorMessage }}
      </div>
    </div>
    <input
      v-model="model"
      :type="inputType()"
      class="uc-form-text-input"
      :class="{ 'uc-form-text-input-invalid': errorMessage }"
      v-bind="inputAttrs()"
      autocomplete="off"
    />
  </div>
</template>

<script lang="ts" setup>
import { useAttrs } from 'vue'
import { omit } from 'lodash-es'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | number>({ default: '' })

defineProps<{
  label?: string
  errorMessage?: string
}>()

const attrs = useAttrs()

function inputAttrs() {
  return omit(attrs, ['class', 'type', 'autocomplete'])
}

function inputType() {
  return (attrs.type as string) ?? 'text'
}

function inputId() {
  return attrs.id as string
}
</script>
