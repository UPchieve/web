<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import CheckBox from '@/components/CheckBox.vue'
import {
  getShareInfoFields,
  setShareInfoFields,
} from '@/services/BrowserStorageService'
import { buildShareInfoMessage } from '@/utils/build-share-info-message'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS, SHARE_INFO_FIELDS, type ShareInfoFieldKey } from '@/consts'

const props = withDefaults(
  defineProps<{
    volunteerOccupations?: string[]
    numSessionsTutored: number
    numStudentsTutored: number
    totalHoursTutored: number
    showButtons?: boolean
  }>(),
  { showButtons: true }
)

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const store = useStore()
const userId = computed(() => store.state.user.user.id)

//Defaults to all selected
const selectedFields = ref<ShareInfoFieldKey[]>(
  getShareInfoFields(userId.value) ??
    SHARE_INFO_FIELDS.map((field) => field.key)
)

function isSelected(key: ShareInfoFieldKey) {
  return selectedFields.value.includes(key)
}

function toggleField(key: ShareInfoFieldKey, checked: boolean) {
  selectedFields.value = checked
    ? [...selectedFields.value, key]
    : selectedFields.value.filter((field) => field !== key)
}

const previewMessage = computed(() =>
  buildShareInfoMessage(selectedFields.value, {
    occupations: props.volunteerOccupations,
    numSessionsTutored: props.numSessionsTutored,
    numStudentsTutored: props.numStudentsTutored,
    totalHoursTutored: props.totalHoursTutored,
  })
)

const hasSelection = computed(() => previewMessage.value.length > 0)

function save(fields: ShareInfoFieldKey[]) {
  setShareInfoFields(userId.value, fields)
  AnalyticsService.captureEvent(
    fields.length > 0
      ? EVENTS.VOLUNTEER_SELECTED_TO_SHARE_INFO
      : EVENTS.VOLUNTEER_OPTED_OUT_OF_SHARE_INFO,
    { fields }
  )
  emit('saved')
}

function handleSave() {
  save(selectedFields.value)
}

function handleOptOut() {
  selectedFields.value = []
  save([])
}

defineExpose({
  save: () => save(selectedFields.value),
})
</script>

<template>
  <div class="share-info-form">
    <div class="preview">
      <p
        v-if="hasSelection"
        class="preview-text"
        data-testid="share-info-preview"
      >
        {{ previewMessage }}
      </p>
      <p
        v-else
        class="preview-text preview-text--empty"
        data-testid="share-info-preview"
      >
        Nothing will be shared with your student.
      </p>
    </div>
    <div
      v-for="field in SHARE_INFO_FIELDS"
      :key="field.key"
      class="uc-form-checkbox"
    >
      <CheckBox
        :id="field.key"
        :checked="isSelected(field.key)"
        :model-value="isSelected(field.key)"
        :data-testid="field.key"
        @update:model-value="
          (checked: boolean) => toggleField(field.key, checked)
        "
      >
        {{ field.label }}
      </CheckBox>
    </div>
    <div v-if="showButtons" class="share-info-form-buttons">
      <button
        class="uc-form-button-secondary secondary-button"
        type="button"
        @click="handleOptOut"
      >
        Don't share anything
      </button>
      <button class="uc-form-button" type="button" @click="handleSave">
        Save
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview {
  background: $c-background-grey;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.preview-text {
  margin: 0;
  font-style: italic;
}

.preview-text--empty {
  color: $c-secondary-grey;
  font-style: normal;
}

.uc-form-button {
  margin-left: 0;
  margin-top: 0;
  margin-bottom: 16px;
}

.share-info-form-buttons {
  @include flex-container(row, center, center);
  margin-top: 24px;
  gap: 12px;
}

.secondary-button {
  width: 100%;
}
</style>
