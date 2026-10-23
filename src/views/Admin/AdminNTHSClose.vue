<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  adminNTHSCloseChapters,
  adminNTHSGetChapters,
  type NTHSCloseChapter,
  type NTHSCloseStatus,
} from '@/services/NetworkService'
import ModalService from '@/services/ModalService'
import { dayjs } from '@/utils/time-utils'
import { plural } from '@/utils/plural'

type Chapter = NTHSCloseChapter
type CloseStatus = NTHSCloseStatus

const STATUS_LABELS: Record<CloseStatus, string> = {
  closed: 'Closed',
  alreadyClosed: 'Already closed',
  notFound: 'Not found',
  failed: 'Failed',
}

const route = useRoute()
const requestedIds = computed(() => {
  const raw = route.query.ids
  const text = Array.isArray(raw) ? raw.join(',') : (raw ?? '')
  return [
    ...new Set(
      text
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ]
})

const chapters = ref<Chapter[]>([])
const notFoundIds = ref<string[]>([])
const selected = ref<Set<string>>(new Set())
const results = ref<Record<string, CloseStatus>>({})
const isLoading = ref(false)
const isClosing = ref(false)
const error = ref('')

const selectedCount = computed(() => selected.value.size)
const hasResults = computed(() => Object.keys(results.value).length > 0)
const notClosed = computed(() =>
  Object.entries(results.value).filter(
    ([, status]) => status === 'notFound' || status === 'failed'
  )
)

function nameFor(id: string) {
  return chapters.value.find((c) => c.id === id)?.name ?? id
}

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selected.value = next
}

function formatPresidents(chapter: Chapter) {
  return chapter.presidents
    .map((p) => `${p.firstName} ${p.lastName}`.trim())
    .join(', ')
}

function rowStatus(chapter: Chapter) {
  const result = results.value[chapter.id]
  if (result) return STATUS_LABELS[result]
  return chapter.closedAt ? 'Closed' : ''
}

async function load(keepOnly?: Set<string>): Promise<string> {
  if (!requestedIds.value.length) return ''
  isLoading.value = true
  try {
    const res = await adminNTHSGetChapters(requestedIds.value)
    chapters.value = res.chapters
    const found = new Set(chapters.value.map((c) => c.id))
    notFoundIds.value = requestedIds.value.filter((id) => !found.has(id))
    selected.value = new Set(
      chapters.value
        .filter((c) => !c.closedAt && (!keepOnly || keepOnly.has(c.id)))
        .map((c) => c.id)
    )
    return ''
  } catch (e) {
    return `Could not load chapters: ${errorMessage(e)}`
  } finally {
    isLoading.value = false
  }
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

async function onClose() {
  const ids = chapters.value
    .filter((c) => selected.value.has(c.id))
    .map((c) => c.id)
  if (!ids.length) return
  const confirmed = await ModalService.showConfirm(
    `Close ${ids.length} ${plural(ids.length, 'chapter')}?`,
    'Every member will be removed from the chapter. This cannot be undone.',
    { acceptText: 'Close chapters' }
  )
  if (!confirmed) return

  isClosing.value = true
  error.value = ''
  try {
    const res = await adminNTHSCloseChapters(ids)
    const next: Record<string, CloseStatus> = {}
    for (const r of res.results) {
      next[r.chapterId] = r.status
    }
    results.value = next
    selected.value = new Set()
  } catch (e) {
    selected.value = new Set()
    const closeError = `Could not close chapters: ${errorMessage(e)}. Some chapters may have closed.`
    const loadError = await load(new Set(ids))
    error.value = loadError
      ? `${closeError} ${loadError}. Reload the page before closing anything else.`
      : `${closeError} The list below was reloaded.`
  } finally {
    isClosing.value = false
  }
}

onMounted(async () => {
  error.value = await load()
})
</script>

<template>
  <div class="card">
    <h1>Close NTHS Chapters</h1>

    <p v-if="!requestedIds.length">
      No chapters to show. Open this page from the Returning Chapters table.
    </p>
    <p v-else-if="isLoading">Loading...</p>
    <template v-else>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div v-if="chapters.length" class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Chapter</th>
              <th>School</th>
              <th>Founded</th>
              <th>Current members</th>
              <th>Presidents</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="chapter in chapters" :key="chapter.id">
              <td>
                <input
                  v-if="!chapter.closedAt && !hasResults"
                  type="checkbox"
                  :checked="selected.has(chapter.id)"
                  :aria-label="`Close ${chapter.name}`"
                  :disabled="isClosing"
                  @change="toggle(chapter.id)"
                />
              </td>
              <td>{{ chapter.name }}</td>
              <td>{{ chapter.schoolName ?? '' }}</td>
              <td>{{ dayjs(chapter.createdAt).format('l') }}</td>
              <td>{{ chapter.currentMemberCount }}</td>
              <td>{{ formatPresidents(chapter) }}</td>
              <td class="status">{{ rowStatus(chapter) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="notFoundIds.length" class="error">
        Not found: {{ notFoundIds.join(', ') }}
      </p>

      <div v-if="hasResults && notClosed.length" class="error" role="alert">
        <p>These chapters did not close:</p>
        <ul>
          <li v-for="[id, status] in notClosed" :key="id">
            {{ nameFor(id) }} ({{ STATUS_LABELS[status] }})
          </li>
        </ul>
      </div>
      <p v-else-if="hasResults" class="success">
        All selected chapters closed.
      </p>

      <div v-if="!hasResults && chapters.length" class="button-container">
        <button
          class="uc-form-button"
          type="button"
          :disabled="selectedCount === 0 || isClosing"
          @click="onClose"
        >
          {{
            isClosing
              ? 'Closing'
              : `Close ${selectedCount} ${plural(selectedCount, 'chapter')}`
          }}
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.table-wrapper {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
}
th,
td {
  padding: 8px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid #eee;
}
.error {
  color: $c-error-red;
}
.success {
  color: $c-success-green;
}
.button-container {
  display: flex;
  justify-content: end;
  margin-top: 24px;
  button {
    margin-top: 0;
    width: unset;
    padding: 12px 24px;
  }
}

.card {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  max-width: 1000px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}
</style>
