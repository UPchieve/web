<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Spinner from '../Spinner.vue'
import {
  type ChecklistItem,
  toggleCheckbox,
  CheckboxStatus,
} from '@/services/NTHSGroupService'
import { RouterLink } from 'vue-router'
import ExternalPage from '@/assets/ExternalPage.svg'
import Gear from '@/assets/gear.svg'
import Card from './Card.vue'

const props = defineProps<{
  groupId: string
  checklist: ChecklistItem[]
}>()

const checkboxDimensions = 20
const checkboxSize = `${checkboxDimensions}px`

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
  <Card>
    <template v-slot:header>Onboarding Checklist</template>
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
            :disabled="!item.locked && item.status === CheckboxStatus.Done"
            :aria-disabled="item.locked ? 'true' : undefined"
            :aria-describedby="item.locked ? tooltipId(item) : undefined"
            @click="onCheckboxClick(item, $event)"
            @focus="onCheckboxFocus(item)"
            @blur="focusedRow = undefined"
            @input="onToggle(item)"
          />
          {{ item.text }}
        </label>

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
        class="control control-button"
        :to="item.routeTo"
        :data-testid="`checklist-control-${item.actionName}`"
      >
        <Gear class="icon" aria-hidden="true" />
        {{ item.controlText }}
      </RouterLink>

      <a
        v-else-if="item.url"
        class="control control-external"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        :data-testid="`checklist-control-${item.actionName}`"
      >
        {{ item.controlText }}
        <ExternalPage class="icon" aria-hidden="true" />
      </a>
    </div>
  </Card>
</template>

<style scoped lang="scss">
.row {
  padding: 0.4em 1em;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  column-gap: 8px;
  row-gap: 2px;
}
.anchor {
  position: relative;
  flex: 1 1 14em;
}
.item {
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  margin: 0;
  text-align: left;
}
.checkbox {
  width: v-bind(checkboxSize);
  height: v-bind(checkboxSize);
  flex-shrink: 0;
  accent-color: $c-information-blue;
  color: white;
}
.checkbox.locked {
  // aria-disabled has no disabled styling, so add back the :disabled gray.
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
  color: $c-information-blue;
  font-size: 14px;
  white-space: nowrap;
}
.control-button {
  border: 1px solid $c-border-grey;
  border-radius: 16px;
  padding: 4px 12px;

  &:hover {
    border-color: $c-information-blue;
    background: $c-background-grey;
  }
}
.control-external {
  text-decoration: underline;
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
