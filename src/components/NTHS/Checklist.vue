<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Spinner from '../Spinner.vue'
import {
  type ChecklistItem,
  toggleCheckbox,
  CheckboxStatus,
} from '@/services/NTHSGroupService'
import { RouterLink } from 'vue-router'
import ExternalPage from '@/assets/ExternalPage.svg'
import HQSection from './HQ/HQSection.vue'

const props = defineProps<{
  groupId: string
  checklist: ChecklistItem[]
}>()

const checkboxDimensions = 20
const checkboxSize = `${checkboxDimensions}px`

const doneCount = computed(
  () =>
    props.checklist.filter(({ status }) => status === CheckboxStatus.Done)
      .length
)
const allDone = computed(
  () => props.checklist.length > 0 && doneCount.value === props.checklist.length
)

const tooltipId = ({ actionName }: ChecklistItem) =>
  `checklist-tooltip-${actionName.replaceAll(' ', '-')}`

const hoveredRow = ref<string>()
const focusedRow = ref<string>()
const dismissed = ref(false)

const tooltipOpen = (item: ChecklistItem) =>
  !dismissed.value &&
  (hoveredRow.value === item.actionName || focusedRow.value === item.actionName)

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') dismissed.value = true
}
onMounted(() => document.addEventListener('keydown', onEscape))
onUnmounted(() => document.removeEventListener('keydown', onEscape))

function onRowEnter(item: ChecklistItem) {
  hoveredRow.value = item.actionName
  dismissed.value = false
}

function onCheckboxFocus(item: ChecklistItem) {
  focusedRow.value = item.actionName
  dismissed.value = false
}

// A locked row is aria-disabled rather than disabled so it stays in the tab order
// but it is still interactive so we need to manually cancel click events
function onCheckboxClick(item: ChecklistItem, event: MouseEvent) {
  if (item.locked) event.preventDefault()
}

function onToggle(item: ChecklistItem) {
  toggleCheckbox({ item, groupId: props.groupId })
}
</script>

<template>
  <HQSection eyebrow="Set up">
    <template v-slot:header-end>
      <span class="count" :class="{ complete: allDone }">
        {{ allDone ? 'Done ✓' : `${doneCount} of ${checklist.length} done` }}
      </span>
    </template>

    <h2 class="card-title" data-testid="card-title">Set up your chapter</h2>

    <div class="list">
      <div
        v-for="item in checklist"
        :key="item.actionName"
        class="row"
        :data-testid="`checklist-item-${item.actionName}`"
      >
        <div
          class="anchor"
          @mouseenter="onRowEnter(item)"
          @mouseleave="hoveredRow = undefined"
        >
          <label class="item">
            <Spinner
              :container-width="checkboxDimensions"
              :container-height="checkboxDimensions"
              :width="checkboxDimensions"
              :height="checkboxDimensions"
              :thickness="4"
              class="checkbox"
              v-if="item.status === CheckboxStatus.Saving"
            />
            <input
              v-else
              class="checkbox"
              :class="{ locked: item.locked }"
              type="checkbox"
              :data-testid="`checklist-checkbox-${item.actionName}`"
              :checked="item.status === CheckboxStatus.Done"
              :aria-disabled="item.locked ? 'true' : undefined"
              :aria-describedby="item.locked ? tooltipId(item) : undefined"
              @click="onCheckboxClick(item, $event)"
              @focus="onCheckboxFocus(item)"
              @blur="focusedRow = undefined"
              @input="onToggle(item)"
            />
            <span
              class="title"
              :class="{ done: item.status === CheckboxStatus.Done }"
              >{{ item.text }}</span
            >
          </label>

          <p v-if="item.help" class="help">{{ item.help }}</p>

          <span
            v-if="item.locked"
            class="tooltip"
            :class="{ open: tooltipOpen(item) }"
            role="tooltip"
            :id="tooltipId(item)"
            :data-testid="`checklist-tooltip-${item.actionName}`"
            >{{ item.lockedTooltip }}</span
          >
        </div>

        <RouterLink
          v-if="item.routeTo"
          class="control"
          :to="item.routeTo"
          :data-testid="`checklist-control-${item.actionName}`"
        >
          {{ item.controlText }}
          <ExternalPage class="icon" aria-hidden="true" />
        </RouterLink>

        <a
          v-else-if="item.url"
          class="control"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          :data-testid="`checklist-control-${item.actionName}`"
        >
          {{ item.controlText }}
          <ExternalPage class="icon" aria-hidden="true" />
        </a>
      </div>
    </div>
  </HQSection>
</template>

<style scoped lang="scss">
.count {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: $c-secondary-grey;
  white-space: nowrap;
}
.count.complete {
  color: $c-nths-deep-teal;
}
.card-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.3;
  margin-top: 8px;
}
.list {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  column-gap: 14px;
  row-gap: 8px;
  padding: 13px 0;
  border-top: 1px solid $c-nths-track;
}
.anchor {
  position: relative;
  flex: 1 1 14em;
}
.item {
  display: flex;
  justify-content: start;
  align-items: flex-start;
  gap: 14px;
  margin: 0;
  text-align: left;
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
.help {
  margin: 3px 0 0 calc(v-bind(checkboxSize) + 14px);
  font-size: 13px;
  line-height: 1.5;
  color: $c-secondary-grey;
  text-align: left;
}
.checkbox {
  width: v-bind(checkboxSize);
  height: v-bind(checkboxSize);
  flex-shrink: 0;
  margin: 1px 0 0;
  appearance: none;
  background: $upchieve-white;
  border: 2px solid $border-grey;
  border-radius: 4px;
}
.checkbox:checked {
  background-color: $c-nths-navy;
  border-color: $c-nths-navy;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><path d='M1.5 6.3 4.4 9.2 10.5 3' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px 12px;
}
// aria-disabled has no disabled styling, so add back the :disabled gray. A
// checked locked box keeps the navy fill, or it reads as not done.
.checkbox.locked:not(:checked) {
  filter: grayscale(1) opacity(0.3);
}
.checkbox.loader :deep(div) {
  border-color: $c-information-blue transparent transparent transparent;
}
.control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  background: $c-nths-sky;
  border-radius: 4px;
  padding: 5px 10px;
  color: $c-information-blue;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  text-decoration: none;
}
.control:hover {
  color: $button-primary-bg-hover;
}
.icon {
  width: 14px;
  height: 14px;
}
.tooltip {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 1;
  max-width: 22em;
  padding: 4px 8px;
  border-radius: 4px;
  background: $c-soft-black;
  color: white;
  font-size: 12px;
  text-align: left;
  visibility: hidden;
  opacity: 0;
  transition:
    opacity 0.15s ease-in-out,
    visibility 0.15s;
}
// Bridges the 4px gap between the label and the tooltip so the pointer
// can reach the tooltip without closing it.
.tooltip::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: 4px;
}
.tooltip.open {
  visibility: visible;
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}
</style>
