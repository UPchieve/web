<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from 'vuex'
import Spinner from '@/components/Spinner.vue'
import ExternalPage from '@/assets/ExternalPage.svg'
import HQSection from './HQ/HQSection.vue'
import LoggerService from '@/services/LoggerService'
import type {
  NTHSChecklistItemPublic,
  NTHSChecklistItemStatus,
  NTHSChecklistPublic,
} from '@upchieve/api-contracts/nths-checklist'

const props = defineProps<{
  groupId: string
  checklist: NTHSChecklistPublic
}>()
const store = useStore()
const savingItems = ref(new Set<string>())
const itemErrors = ref<Record<string, string>>({})

const processed = ({ status }: NTHSChecklistItemPublic) =>
  status === 'complete' || status === 'skipped'
const doneCount = (items: NTHSChecklistItemPublic[]) =>
  items.filter((item) => item.checkable && processed(item)).length
const checkableCount = (items: NTHSChecklistItemPublic[]) =>
  items.filter((item) => item.checkable).length
const sectionComplete = (items: NTHSChecklistItemPublic[]) =>
  checkableCount(items) > 0 && doneCount(items) === checkableCount(items)
const collapsedSections = ref(
  new Set(
    props.checklist.sections
      .filter((section) => sectionComplete(section.items))
      .map((section) => section.id)
  )
)

function toggleSection(sectionId: number) {
  const collapsed = new Set(collapsedSections.value)
  if (collapsed.has(sectionId)) collapsed.delete(sectionId)
  else collapsed.add(sectionId)
  collapsedSections.value = collapsed
}

async function updateStatus(
  item: NTHSChecklistItemPublic,
  status: NTHSChecklistItemStatus
) {
  if (savingItems.value.has(item.key)) return
  savingItems.value = new Set(savingItems.value).add(item.key)
  itemErrors.value = { ...itemErrors.value, [item.key]: '' }
  try {
    await store.dispatch('nths/updateNTHSChecklistItemProgress', {
      groupId: props.groupId,
      itemKey: item.key,
      status,
    })
  } catch (err) {
    LoggerService.noticeError(err, 'Could not update the NTHS checklist item')
    itemErrors.value = {
      ...itemErrors.value,
      [item.key]: 'Something went wrong while saving. Please try again.',
    }
  } finally {
    const saving = new Set(savingItems.value)
    saving.delete(item.key)
    savingItems.value = saving
  }
}

const toggleComplete = (item: NTHSChecklistItemPublic) =>
  updateStatus(item, item.status === 'complete' ? 'incomplete' : 'complete')
const toggleSkipped = (item: NTHSChecklistItemPublic) =>
  updateStatus(item, item.status === 'skipped' ? 'incomplete' : 'skipped')
const dueDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(value)
  )
</script>

<template>
  <div class="sections">
    <HQSection
      v-for="section in checklist.sections"
      :key="section.id"
      :eyebrow="section.title"
    >
      <template #header-end>
        <button
          type="button"
          class="section-toggle"
          :aria-expanded="!collapsedSections.has(section.id)"
          :aria-controls="`checklist-section-${section.id}`"
          :aria-label="`${
            collapsedSections.has(section.id) ? 'Expand' : 'Collapse'
          } ${section.title}`"
          :data-testid="`checklist-section-toggle-${section.id}`"
          @click="toggleSection(section.id)"
        >
          <span v-if="checkableCount(section.items)" class="count">
            {{ doneCount(section.items) }} of
            {{ checkableCount(section.items) }} done
          </span>
          <span
            class="chevron"
            :class="{ collapsed: collapsedSections.has(section.id) }"
            aria-hidden="true"
          />
        </button>
      </template>

      <div
        v-if="!collapsedSections.has(section.id)"
        :id="`checklist-section-${section.id}`"
        class="list"
      >
        <div
          v-for="item in section.items"
          :key="item.key"
          class="row"
          :data-testid="`checklist-item-${item.key}`"
        >
          <label class="item">
            <Spinner
              v-if="savingItems.has(item.key)"
              :container-width="20"
              :container-height="20"
              :width="20"
              :height="20"
              :thickness="4"
              class="checkbox"
            />
            <input
              v-else-if="item.checkable"
              class="checkbox"
              type="checkbox"
              :checked="processed(item)"
              :disabled="item.status === 'skipped'"
              :data-testid="`checklist-checkbox-${item.key}`"
              @change="toggleComplete(item)"
            />
            <span v-else class="checkbox-placeholder" aria-hidden="true" />
            <span class="title" :class="{ done: processed(item) }">
              {{ item.title }}
            </span>
          </label>

          <div class="details">
            <p v-if="item.description" class="description">
              {{ item.description }}
            </p>
            <p v-if="item.dueDate" class="due-date">
              Due {{ dueDate(item.dueDate) }}
            </p>
            <div v-if="item.resources.length" class="resources">
              <span class="resources-label">Resources:</span>
              <template
                v-for="resource in item.resources"
                :key="`${item.key}-${resource.label}`"
              >
                <a
                  v-if="resource.url"
                  :href="resource.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  :data-testid="`checklist-resource-${item.key}`"
                >
                  {{ resource.label }}
                  <ExternalPage class="icon" aria-hidden="true" />
                </a>
                <span v-else>{{ resource.label }}</span>
              </template>
            </div>
            <button
              v-if="item.skippable"
              type="button"
              class="skip"
              :disabled="savingItems.has(item.key)"
              :data-testid="`checklist-skip-${item.key}`"
              @click="toggleSkipped(item)"
            >
              {{
                item.status === 'skipped' ? 'Skipped · Undo' : 'Skip this step'
              }}
            </button>
            <p v-if="itemErrors[item.key]" class="error" role="alert">
              {{ itemErrors[item.key] }}
            </p>
          </div>
        </div>
      </div>
    </HQSection>
  </div>
</template>

<style scoped lang="scss">
.sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.count {
  color: $c-secondary-grey;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.section-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  border: 0;
  background: transparent;
}
.chevron {
  width: 9px;
  height: 9px;
  border-right: 2px solid $c-nths-navy;
  border-bottom: 2px solid $c-nths-navy;
  transform: rotate(225deg);
  transition: transform 150ms ease;
}
.chevron.collapsed {
  transform: rotate(45deg);
}
.list {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}
.row {
  padding: 16px 0;
  border-top: 1px solid $c-nths-track;
}
.item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 0;
}
.checkbox,
.checkbox-placeholder {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}
.checkbox {
  appearance: none;
  background: $upchieve-white;
  border: 2px solid $border-grey;
  border-radius: 4px;
}
.checkbox:checked {
  background-color: $c-nths-navy;
  border-color: $c-nths-navy;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><path d='M1.5 6.3 4.4 9.2 10.5 3' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-position: center;
  background-repeat: no-repeat;
  background-size: 12px;
}
.title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.35;
}
.title.done {
  color: $c-secondary-grey;
  text-decoration: line-through;
}
.details {
  margin-left: 34px;
}
.description,
.due-date {
  color: $c-secondary-grey;
  font-size: 13px;
  line-height: 1.5;
  margin: 4px 0 0;
}
.due-date {
  font-weight: 500;
}
.resources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 10px;
  font-size: 12px;
}
.resources-label {
  color: $c-secondary-grey;
  font-weight: 600;
  text-transform: uppercase;
}
.resources a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.icon {
  width: 12px;
  height: 12px;
}
.skip {
  margin-top: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: $c-information-blue;
  font-size: 12px;
  text-decoration: underline;
}
.error {
  @include nths-error-box;
  margin-top: 10px;
  font-size: 13px;
}
</style>
