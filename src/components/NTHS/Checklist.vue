<script setup lang="ts">
import { ref } from 'vue'
import { useNthsStore } from '@/stores/nths'
import Spinner from '@/components/Spinner.vue'
import NTHSLink from './HQ/NTHSLink.vue'
import RequirementMeter from './HQ/RequirementMeter.vue'
import {
  checkableCount,
  doneCount,
  isProcessed as processed,
  phaseLabel,
  startOpenSectionId,
} from '@/services/NTHSChecklistService'
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
const nths = useNthsStore()
const savingItems = ref(new Set<string>())
const itemErrors = ref<Record<string, string>>({})

const openAtStart = startOpenSectionId(props.checklist)
const collapsedSections = ref(
  new Set(
    props.checklist.sections
      .filter((section) => section.id !== openAtStart)
      .map((section) => section.id)
  )
)

function toggleSection(sectionId: number) {
  const collapsed = new Set(collapsedSections.value)
  if (collapsed.has(sectionId)) {
    collapsed.delete(sectionId)
  } else {
    collapsed.add(sectionId)
  }
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
    await nths.updateNTHSChecklistItemProgress({
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
</script>

<template>
  <div class="sections">
    <section
      v-for="section in checklist.sections"
      :key="section.id"
      class="card"
    >
      <div class="head" :class="{ 'no-meter': !checkableCount(section.items) }">
        <div class="head-text">
          <p class="eyebrow">
            <span aria-hidden="true">✦</span>
            {{ phaseLabel(checklist.sections, section.id) }}
            <span v-if="section.timeframe" class="timeframe">
              {{ section.timeframe }}
            </span>
          </p>
          <h2 class="section-title">{{ section.title }}</h2>
          <p v-if="section.intro" class="intro">{{ section.intro }}</p>
        </div>
        <RequirementMeter
          v-if="checkableCount(section.items)"
          class="head-meter"
          :label="`${section.title} progress`"
          :value="doneCount(section.items)"
          :goal="checkableCount(section.items)"
        >
          <div class="meter-row">
            <span class="count">
              <strong>{{ doneCount(section.items) }}</strong> of
              {{ checkableCount(section.items) }} done
            </span>
            <span class="left">
              {{ checkableCount(section.items) - doneCount(section.items) }}
              left
            </span>
          </div>
        </RequirementMeter>
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
          <span
            class="chevron"
            :class="{ collapsed: collapsedSections.has(section.id) }"
            aria-hidden="true"
          />
        </button>
      </div>

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
            <div v-if="item.resources.length" class="resources">
              <template
                v-for="resource in item.resources"
                :key="`${item.key}-${resource.label}`"
              >
                <NTHSLink
                  v-if="resource.url"
                  :href="resource.url"
                  :data-testid="`checklist-resource-${item.key}`"
                >
                  {{ resource.label }} <span aria-hidden="true">→</span>
                </NTHSLink>
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
    </section>
  </div>
</template>

<style scoped lang="scss">
.sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.card {
  @include nths-section-card;
}
.head {
  display: grid;
  grid-template-columns: 1fr minmax(0, 300px) auto;
  grid-template-areas: 'text meter toggle';
  align-items: start;
  gap: 12px 24px;
}
.head-text {
  grid-area: text;
}
.head.no-meter {
  grid-template-columns: 1fr auto;
  grid-template-areas: 'text toggle';
}
.head-meter {
  grid-area: meter;
  align-self: center;
}
.section-toggle {
  grid-area: toggle;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
}
@media (max-width: 600px) {
  .head {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'text toggle'
      'meter meter';
  }
  .head.no-meter {
    grid-template-columns: 1fr auto;
    grid-template-areas: 'text toggle';
  }
  .head-meter {
    padding: 0 24px;
  }
}
.eyebrow {
  @include nths-section-eyebrow;
  font-weight: 500;
  letter-spacing: 0.96px;
  color: $c-soft-black;
  margin: 0;
}
.timeframe {
  margin-left: 6px;
  color: $c-secondary-grey;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}
.section-title {
  margin: 6px 0 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
}
.intro {
  color: $c-secondary-grey;
  font-size: 14px;
  line-height: 1.5;
  margin: 6px 0 0;
}
.meter-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: $c-secondary-grey;
}
.count strong {
  color: $c-soft-black;
  font-weight: 700;
}
.left {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.96px;
  text-transform: uppercase;
}
.chevron {
  display: block;
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
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
.checkbox {
  appearance: none;
  background: $c-background-grey;
  border: 0;
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
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}
.title.done {
  color: $c-secondary-grey;
  text-decoration: line-through;
}
.details {
  margin-left: 38px;
}
.description {
  color: $c-secondary-grey;
  font-size: 14px;
  line-height: 20px;
  margin: 0;
}
.resources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 2px;
  font-size: 14px;
  font-weight: 500;
}
.resources a {
  color: $c-information-blue;
  text-decoration: underline;
}
.skip {
  margin-top: 2px;
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
