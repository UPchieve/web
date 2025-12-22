<script lang="ts" setup>
// @TODO: Delete me once the new training is fully rolled out!
import { useStore } from 'vuex'
import { computed } from 'vue'

import TrainingCourseView from '@/views/TrainingCourseView/index.vue'
import TrainingViewV3 from '@/views/UpchieveTrainingView/index.vue'

const store = useStore()
const isUpchieve101V3Enabled = computed(
  () => store.getters['featureFlags/isUpchieve101V3Enabled']
)
const trainingComponent = computed(() => {
  if (isUpchieve101V3Enabled.value) {
    return TrainingViewV3
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
