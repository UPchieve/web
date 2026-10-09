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
    <div class="text-field-input">
      <input
        v-model="model"
        :type="inputType()"
        class="uc-form-text-input"
        :class="{
          'uc-form-text-input-invalid': errorMessage,
          'has-append': $slots.append,
        }"
        autocomplete="off"
        v-bind="inputAttrs()"
      />
      <div v-if="$slots.append" class="text-field-append">
        <slot name="append" />
      </div>
    </div>
    <div v-if="metadata" class="metadata">
      {{ metadata }}
    </div>
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
  metadata?: string
}>()

const attrs = useAttrs()

function inputAttrs() {
  return omit(attrs, ['class', 'type'])
}

function inputType() {
  return (attrs.type as string) ?? 'text'
}

function inputId() {
  return attrs.id as string
}
</script>

<style lang="scss" scoped>
.text-field-input {
  @include flex-container(column);
  position: relative;
}

.has-append {
  padding-right: 36px;
}

.text-field-append {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 8px;
  display: flex;
  align-items: center;
}
</style>
