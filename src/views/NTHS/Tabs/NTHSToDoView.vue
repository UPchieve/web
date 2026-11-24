<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import Checklist from '@/components/NTHS/Checklist.vue'
import DoThisNowCard from '@/components/NTHS/DoThisNowCard.vue'
import { doThisNowPick } from '@/services/NTHSChecklistService'
import Spinner from '@/components/Spinner.vue'
import LoggerService from '@/services/LoggerService'
import { useNthsStore } from '@/stores/nths'

const nths = useNthsStore()
const group = computed(() => nths.NTHSGroups?.[0])
const checklist = computed(() => nths.NTHSChecklistData)
const hasItems = computed(() =>
  checklist.value?.sections.some(({ items }) => items.length > 0)
)

const pick = computed(() =>
  checklist.value ? doThisNowPick(checklist.value) : undefined
)

const isLoading = ref(true)
const loadFailed = ref(false)

onBeforeMount(async () => {
  try {
    const groupId = group.value?.groupInfo?.id
    if (groupId) {
      await nths.fetchNTHSChecklist(groupId)
    }
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
    <h1 class="visually-hidden">To Do</h1>
    <Spinner v-if="isLoading" data-testid="checklist-loading" />
    <p v-else-if="loadFailed" class="notice" data-testid="checklist-error">
      We couldn't load your checklist. Refresh the page to try again.
    </p>
    <template v-else-if="checklist && hasItems">
      <DoThisNowCard v-if="pick" :item="pick" />
      <Checklist :groupId="group.groupInfo.id" :checklist="checklist" />
    </template>
    <p v-else class="notice" data-testid="checklist-empty">
      There is nothing on your checklist right now.
    </p>
  </div>
</template>

<style scoped lang="scss">
.to-do {
  @include nths-tab-column(900px);
}
.notice {
  @include nths-notice;
}
.visually-hidden {
  @include visually-hidden;
}
</style>
