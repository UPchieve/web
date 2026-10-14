<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import ToggleButton from './ToggleButton.vue'
import TutorInfoCard from '@/components/TutorInfoCard.vue'
import AnalyticsService from '@/services/AnalyticsService'
import UserService from '@/services/UserService'
import { EVENTS, SHARE_INFO_FIELDS, type ShareInfoFieldKey } from '@/consts'
import {
  toPublicProfileInfoShared,
  type ShareableVolunteerData,
} from '@/utils/build-share-info-message'

const props = withDefaults(
  defineProps<{
    info: ShareableVolunteerData
    showButtons?: boolean
    stackedLayout?: boolean
  }>(),
  { showButtons: true, stackedLayout: false }
)

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const store = useStore()

//Defaults to all selected
const selectedFields = ref<ShareInfoFieldKey[]>(
  (store.state.user.user.publicProfileKeys as
    | ShareInfoFieldKey[]
    | undefined
    | null) ?? SHARE_INFO_FIELDS.map((field) => field.key)
)

function isSelected(key: ShareInfoFieldKey) {
  return selectedFields.value.includes(key)
}

function toggleField(key: ShareInfoFieldKey, checked: boolean) {
  selectedFields.value = checked
    ? [...selectedFields.value, key]
    : selectedFields.value.filter((field) => field !== key)
}

const hasSelection = computed(() => selectedFields.value.length > 0)

// Preview the card as students will see it, with only the selected fields
const previewInfo = computed(() =>
  toPublicProfileInfoShared(props.info, selectedFields.value)
)

async function save(fields: ShareInfoFieldKey[]) {
  await UserService.setProfile({ publicProfileKeys: fields }, store)
  AnalyticsService.captureEvent(
    fields.length > 0
      ? EVENTS.VOLUNTEER_SELECTED_TO_SHARE_INFO
      : EVENTS.VOLUNTEER_OPTED_OUT_OF_SHARE_INFO,
    { fields }
  )
  emit('saved')
}

async function handleSave() {
  await save(selectedFields.value)
}

async function handleOptOut() {
  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_OPTED_OUT_OF_SHARE_INFO)
  selectedFields.value = []
  await save([])
}

defineExpose({
  save: () => save(selectedFields.value),
  // Stores as sharing nothing when the modal is dismissed
  optOut: () => save([]),
})
</script>

<template>
  <div
    class="share-info-form"
    :class="{ 'share-info-form--stacked': stackedLayout }"
  >
    <div class="preview">
      <TutorInfoCard
        v-if="hasSelection"
        :info="previewInfo"
        viewer-role="volunteer"
        data-testid="share-info-preview"
      />
      <p
        v-else
        class="preview-text preview-text--empty"
        data-testid="share-info-preview"
      >
        Nothing will be shared with your student.
      </p>
    </div>
    <div
      class="share-info-toggle-buttons"
      :class="{ 'share-info-toggle-buttons--stacked': stackedLayout }"
    >
      <div
        v-for="field in SHARE_INFO_FIELDS"
        :key="field.key"
        class="toggle-buttons"
      >
        <ToggleButton
          :id="field.key"
          :value="isSelected(field.key)"
          sync
          :data-testid="field.key"
          @input="(checked: boolean) => toggleField(field.key, checked)"
          :color="{
            unchecked: '#abb2bd',
          }"
          class="toggle-button"
        />
        <span class="toggle-field-label">{{ field.label }}</span>
      </div>
    </div>
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
</template>

<style lang="scss" scoped>
.share-info-form {
  @include flex-container(row);
  @include breakpoint-between(0, 800px) {
    flex-direction: column;
  }
}

.share-info-form.share-info-form--stacked {
  flex-direction: column;
}

.share-info-toggle-buttons {
  @include flex-container(column, center, flex-start);
  padding: 16px;
  @include child-spacing(top, 12px);
}

.share-info-toggle-buttons--stacked {
  padding: 0px 16px;
}

.toggle-buttons {
  @include flex-container(row, center, flex-start);
  gap: 8px;
}

.preview {
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
  min-height: 210px;
  min-width: 342px;
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
  margin-bottom: 0;
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
