<script lang="ts">
import type { TrainingModule as TrainingModuleType } from '@/services/TrainingService'
</script>

<script lang="ts" setup>
import TrainingMaterial from '@/views/Training/TrainingMaterial.vue'
const props = defineProps<{ module: TrainingModuleType }>()
</script>

<template>
  <div class="module-container">
    <slot name="customModule" />
    <TrainingMaterial
      v-for="material in props.module.materials"
      :key="material.materialKey"
      :material="material"
    />
  </div>
</template>

<style lang="scss" scoped>
.module-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 32px 16px 32px;
  background-color: white;
  border-radius: 16px;
}
</style>
