<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import Checklist from '@/components/NTHS/Checklist.vue'
import Spinner from '@/components/Spinner.vue'
import LoggerService from '@/services/LoggerService'

const store = useStore()
const group = computed(() => store.state.nths.NTHSGroups?.[0])
const checklist = computed(() => store.getters['nths/NTHSChecklist'])

const isLoading = ref(true)
const loadFailed = ref(false)

onBeforeMount(async () => {
  try {
    await store.dispatch(
      'nths/fetchNTHSGroupActions',
      group.value?.groupInfo?.id
    )
  } catch (err) {
    loadFailed.value = true
    LoggerService.noticeError(err, 'Could not load the NTHS chapter checklist')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="to-do">
    <div class="page-header">
      <h1 class="page-title">Your checklist</h1>
      <p class="page-subtitle">Finish these to get your chapter running.</p>
    </div>

    <Spinner v-if="isLoading" data-testid="checklist-loading" />
    <p v-else-if="loadFailed" class="notice" data-testid="checklist-error">
      We couldn't load your checklist. Refresh the page to try again.
    </p>
    <Checklist
      v-else-if="checklist.length"
      :groupId="group.groupInfo.id"
      :checklist="checklist"
    />
    <p v-else class="notice" data-testid="checklist-empty">
      There is nothing on your checklist right now.
    </p>
  </div>
</template>

<style scoped lang="scss">
.to-do {
  @include nths-tab-column(900px);
}
.page-title {
  @include nths-page-title;
}
.page-subtitle {
  @include nths-page-subtitle;
}
.notice {
  @include nths-notice;
}
</style>
