<script lang="ts" setup>
import { useStore } from 'vuex'
import { computed } from 'vue'

import TrainingCourseView from '@/views/TrainingCourseView/index.vue'
import TrainingView from '@/views/Training/index.vue'
import TrainingViewV3 from '@/views/UpchieveTrainingView/index.vue'

const store = useStore()
const useLmsStyleTrainingComponent = computed(
  () => store.getters['featureFlags/isUpchieve101LMSFormatEnabled'] // pragma: allowlist secret
)
const isUpchieve101V3Enabled = computed(
  () => store.getters['featureFlags/isUpchieve101V3Enabled']
)
const trainingComponent = computed(() => {
  if (isUpchieve101V3Enabled.value) {
    return TrainingViewV3
  } else if (useLmsStyleTrainingComponent.value) {
    return TrainingView
  } else {
    return TrainingCourseView
  }
})
</script>

<template>
  <div class="training-component">
    <component :is="trainingComponent" />
  </div>
</template>

<style lang="scss" scoped>
.training-component {
  display: flex;
  margin: 40px;
}
</style>
