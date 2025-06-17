<script lang="ts">
import type { TrainingMaterial as TrainingMaterialType } from '@/services/TrainingService'
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import Document from '@/views/TrainingCourseView/Material/Document.vue'
import Video from '@/views/TrainingCourseView/Material/Video.vue'

const props = defineProps<{ material: TrainingMaterialType }>()
const documentUrl = computed(() => props.material.linkUrl ?? '')
</script>

<template>
  <div class="material-container">
    <h2 class="material-title">{{ props.material.name }}</h2>
    <div class="material-description" v-if="props.material.description">
      {{ props.material.description }}
    </div>

    <!--    Video materials-->
    <Video
      class="video-material"
      v-if="props.material.type === 'video'"
      :resourceId="props.material.resourceId"
      :pdf="props.material.videoPDF"
      :links="props.material.links"
      cssClass="video-material"
    />

    <!--    Document materials-->
    <Document
      v-if="props.material.type === 'document'"
      :linkUrl="documentUrl"
    />
  </div>
</template>

<style lang="scss" scoped>
.material-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-content: center;
  align-items: center;
  gap: 8px;
}

.material-title {
  @include font-category('display-small');
}

.video-material {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  :deep(.link) {
    font-weight: bold;
  }
}

:deep(.document) {
  width: 60%;
}
</style>
