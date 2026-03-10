<script lang="ts" setup>
import { computed } from 'vue'
import InformationIcon from '@/assets/information.svg'

// TODO: add union types later, i.e. 'information' | 'danger' | 'success'
export type IconVariant = 'information'

export type CalloutProps = {
  icon?: IconVariant
}
const { icon = 'information' } = defineProps<CalloutProps>()
const iconVariant = computed(() => {
  return InformationIcon // TODO: Return other svgs here
})
</script>

<template>
  <div class="main-container">
    <div class="icon-container">
      <slot name="icon" class="icon" v-if="!icon" />
      <component :is="iconVariant" v-else class="icon" />
    </div>
    <slot name="content" />
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  display: grid;
  grid-template-columns: [icon] 1fr [content] 9fr;
  grid-template-rows: 1fr;
  background-color: lighten($c-information-blue, 45%);
  border-radius: 10px;
  padding: 16px;
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
  &:deep(path) {
    fill: $c-information-blue;
  }
}
</style>
