<script setup lang="ts">
import { computed, nextTick, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import { RouterLink } from 'vue-router'
import LoggerService from '@/services/LoggerService'
import type {
  NTHSChecklistItemPublic,
  NTHSChecklistPublic,
} from '@upchieve/api-contracts/nths-checklist'

const props = defineProps<{ groupId: string }>()
const emit = defineEmits<{ (e: 'finished'): void }>()
const store = useStore()
const checklist = computed<NTHSChecklistPublic | null>(
  () => store.state.nths.NTHSChecklistData
)
const isLoading = ref(true)
const loadFailed = ref(false)

onBeforeMount(async () => {
  try {
    if (!checklist.value) {
      await store.dispatch('nths/fetchNTHSChecklist', props.groupId)
    }
  } catch (err) {
    loadFailed.value = true
    LoggerService.noticeError(err, 'Could not load the NTHS chapter checklist')
  } finally {
    isLoading.value = false
  }
})

const item = computed(() => {
  if (isLoading.value || loadFailed.value) return undefined
  return checklist.value?.sections
    .flatMap(({ items }) => items)
    .find(
      ({ status, checkable, skippable }) =>
        status === 'incomplete' && (checkable || skippable)
    )
})

const heading = ref<HTMLElement>()
const isSaving = ref(false)
const errorMessage = ref('')
const announcement = ref('')

async function updateItem(
  current: NTHSChecklistItemPublic,
  status: 'complete' | 'skipped'
) {
  if (isSaving.value) return
  isSaving.value = true
  errorMessage.value = ''
  announcement.value = ''
  try {
    await store.dispatch('nths/updateNTHSChecklistItemProgress', {
      groupId: props.groupId,
      itemKey: current.key,
      status,
    })
  } catch (err) {
    LoggerService.noticeError(err)
    errorMessage.value = 'Something went wrong while saving. Please try again.'
    return
  } finally {
    isSaving.value = false
  }

  const verb = status === 'skipped' ? 'Skipped' : 'Marked'
  if (item.value) {
    announcement.value = `${verb} "${current.title}".`
    await nextTick()
    heading.value?.focus()
  } else {
    announcement.value = `${verb} "${current.title}". Your checklist is finished.`
    emit('finished')
  }
}
</script>

<template>
  <Transition name="card">
    <section
      v-if="item"
      class="do-next"
      aria-labelledby="do-next-eyebrow"
      data-testid="do-this-next"
    >
      <p id="do-next-eyebrow" class="eyebrow">Up next</p>
      <h2
        ref="heading"
        class="title"
        tabindex="-1"
        data-testid="do-this-next-title"
      >
        {{ item.title }}
      </h2>
      <p v-if="item.description" class="help" data-testid="do-this-next-help">
        {{ item.description }}
      </p>

      <div v-if="item.resources.length" class="resources">
        <span class="resources-label">Resources:</span>
        <ul>
          <li v-for="resource in item.resources" :key="resource.label">
            <a
              v-if="resource.url"
              class="resource"
              :href="resource.url"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="do-this-next-resource"
            >
              {{ resource.label }} <span aria-hidden="true">↗</span>
            </a>
            <span v-else>{{ resource.label }}</span>
          </li>
        </ul>
      </div>

      <div class="actions">
        <button
          v-if="item.checkable"
          type="button"
          class="action mark-done"
          :disabled="isSaving"
          data-testid="do-this-next-mark-done"
          @click="updateItem(item, 'complete')"
        >
          {{ isSaving ? 'Saving…' : 'Mark as done' }}
        </button>
        <button
          v-if="item.skippable"
          type="button"
          class="skip"
          :disabled="isSaving"
          data-testid="do-this-next-skip"
          @click="updateItem(item, 'skipped')"
        >
          Skip this step
        </button>
        <RouterLink
          class="to-do"
          to="/groups/to-do"
          data-testid="do-this-next-to-do"
        >
          See the full checklist
        </RouterLink>
      </div>

      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
  </Transition>
  <p class="visually-hidden" role="status" data-testid="do-this-next-status">
    {{ announcement }}
  </p>
</template>

<style scoped lang="scss">
.do-next {
  @include nths-card(28px 30px);
  background: $c-nths-navy;
  border-color: $c-nths-navy;
  color: $upchieve-white;
}
.eyebrow {
  @include nths-card-eyebrow;
  color: $c-college;
  margin: 0;
}
.title {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.3;
  max-width: 560px;
  margin: 14px 0 0;
}
.title:focus-visible {
  outline: 2px solid $c-college;
  outline-offset: 4px;
}
.help {
  font-size: 15px;
  line-height: 1.6;
  color: rgba($upchieve-white, 0.85);
  max-width: 520px;
  margin: 8px 0 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  margin-top: 18px;
}
.resources {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 12px;
  font-size: 14px;
  color: rgba($upchieve-white, 0.85);
}
.resources-label {
  font-weight: 600;
}
.resources ul {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.resources li:not(:last-child)::after {
  content: '·';
  margin-left: 8px;
}
.resource {
  color: $upchieve-white;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 10px 22px;
  font-size: 15px;
  line-height: 1.2;
  text-decoration: none;
}
.mark-done {
  background: transparent;
  border-color: rgba($upchieve-white, 0.5);
  color: $upchieve-white;
}
.skip {
  border: 0;
  background: transparent;
  color: $upchieve-white;
  text-decoration: underline;
}
.to-do {
  color: $upchieve-white;
  font-size: 14px;
  text-decoration: underline;
}
.error {
  @include nths-error-box;
  color: $c-soft-black;
  margin: 16px 0 0;
}
.visually-hidden {
  @include visually-hidden;
}
.card-enter-active,
.card-leave-active {
  transition: opacity 200ms ease;
}
.card-enter-from,
.card-leave-to {
  opacity: 0;
}
</style>
