<script lang="ts" setup>
import { useStore } from 'vuex'
import { computed } from 'vue'

import TrainingCourseView from '@/views/TrainingCourseView/index.vue'
import TrainingView from '@/views/Training/index.vue'

const store = useStore()
const useLmsStyleTrainingComponent = computed(
  () => store.getters['featureFlags/isUpchieve101LMSFormatEnabled'] // pragma: allowlist secret
)
</script>

<template>
  <component
    :is="useLmsStyleTrainingComponent ? TrainingView : TrainingCourseView"
  />
</template>
