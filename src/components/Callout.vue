<script lang="ts" setup>
import { computed } from 'vue'
import InformationIcon from '@/assets/information.svg'
import WarningIcon from '@/assets/icons/exclamation.svg'

export type Variant = 'information' | 'warning'

export type CalloutProps = {
  variant?: Variant
}
const props = defineProps<CalloutProps>()
const variantIcon = computed(() => {
  return props.variant === 'warning' ? WarningIcon : InformationIcon
})

const variantClasses = computed(() => ({
  warning: props.variant === 'warning',
  information: props.variant === 'information',
}))
</script>

<template>
  <div class="main-container" :class="variantClasses">
    <div class="icon-container">
      <slot name="icon" class="icon" v-if="!props.variant" />
      <component :is="variantIcon" v-else class="icon" />
    </div>
    <slot name="content" />
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  display: grid;
  grid-template-columns: [icon] 1fr [content] 9fr;
  grid-template-rows: 1fr;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid $c-border-grey;
  text-align: start;
}

.main-container.information {
  background-color: lighten($c-information-blue, 45%);
  border: 1px solid $c-information-blue;
}

.main-container.warning {
  background-color: lighten($c-warning-orange, 25%);
  border: 1px solid $c-warning-orange;
}

.icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  padding: 16px 16px 16px 0px;

  svg path {
    height: 25px;
    width: 25px;
  }
}

.icon {
  height: 25px;
  width: 25px;
}

.information .icon {
  &:deep(path) {
    fill: $c-information-blue;
  }
}

.warning .icon {
  &:deep(path) {
    fill: $c-warning-orange;
  }
}
</style>
