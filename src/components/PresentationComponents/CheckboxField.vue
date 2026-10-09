<template>
  <label class="uc-form-checkbox" :for="inputId()" v-bind="wrapperAttrs()">
    <input v-model="model" type="checkbox" v-bind="inputAttrs()" />
    <span class="checkbox-label">
      {{ label }}
    </span>
  </label>
</template>

<script lang="ts" setup>
import { useInputAttrs } from '@/composables/useInputAttrs'

defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>({ default: false })

defineProps<{
  label?: string
}>()

const { wrapperAttrs, inputAttrs, inputId } = useInputAttrs(['type'])
</script>

<style lang="scss" scoped>
.checkbox-label {
  margin-left: 8px;
}
</style>
