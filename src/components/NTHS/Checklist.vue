<script setup lang="ts">
import Spinner from '../Spinner.vue'
import {
  type ChecklistItem,
  type GroupAction,
  toggleCheckbox,
  CheckboxStatus,
} from '@/services/NTHSGroupService'

const props = defineProps<{
  groupId: string
  groupActions: GroupAction[]
  checklist: ChecklistItem[]
}>()

const checkboxDimensions = 20
</script>

<template>
  <div class="checklist">
    <h4 class="title">Onboarding Checklist</h4>
    <div v-for="item in checklist" :key="item.text">
      <label class="row">
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
          type="checkbox"
          :checked="item.status === CheckboxStatus.Done"
          :disabled="item.status === CheckboxStatus.Done"
          v-on:input="
            toggleCheckbox({
              checklist,
              item,
              groupId: props.groupId,
              groupActions: props.groupActions,
            })
          "
        />
        {{ item.text }}</label
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep() {
  --checkbox-dimensions: v-bind(`${checkboxDimensions}px`);
}
.title {
  padding: 0.5em 1em;
  border-bottom: rgb(224, 224, 224) 1px solid;
  line-height: 1.11em;
  font-size: 18px;
  font-weight: 700;
}

.checklist {
  background-color: white;
  border-radius: 4px;
  border: rgb(224, 224, 224) 1px solid;
}
.row {
  padding: 0.25em 1em;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
}
.checkbox {
  width: var(--checkbox-dimensions);
  height: var(--checkbox-dimensions);
  accent-color: $c-information-blue;
  color: white;
}
.checkbox.loader :deep(div) {
  border-color: $c-information-blue transparent transparent transparent;
}
</style>
