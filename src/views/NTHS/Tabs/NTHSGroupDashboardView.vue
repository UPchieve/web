<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import config from '@/config'
import Spinner from '@/components/Spinner.vue'

const store = useStore()
const group = computed(() => store.state.nths.NTHSGroups?.[0])
const isLoaded = ref(false)
</script>

<template>
  <!-- html-validate-disable attribute-allowed-values -- 100% for width and height is not recognized -->
  <div class="iframe-container">
    <iframe
      v-if="Boolean(group?.groupInfo?.id)"
      title="NTHS Group Dashboard"
      class="iframe"
      :class="isLoaded ? '' : 'hide'"
      :src="`${config.NTHSRetoolDashboardUrl}?groupId=${group.groupInfo.id}`"
      width="100%"
      height="100%"
      loading="lazy"
      :onload="() => (isLoaded = true)"
    />
  </div>
  <div class="spinner-container" v-if="!isLoaded">
    <Spinner />
  </div>
</template>

<style lang="scss" scoped>
.iframe-container {
  height: 1414px;
  overflow-x: auto;
}
.iframe {
  display: block;
  border: none;
  min-width: 800px;
}
</style>
