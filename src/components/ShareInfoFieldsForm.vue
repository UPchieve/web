<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import ToggleButton from './ToggleButton.vue'
import TutorInfoCard from '@/components/TutorInfoCard.vue'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import UserService from '@/services/UserService'
import { EVENTS, SHARE_INFO_FIELDS, type ShareInfoFieldKey } from '@/consts'
import {
  toPublicProfileInfoShared,
  type ShareableVolunteerData,
} from '@/utils/build-share-info-message'
import { VolunteerOccupations } from '@/services/VolunteerService'

const props = withDefaults(
  defineProps<{
    info: ShareableVolunteerData
    showButtons?: boolean
    stackedLayout?: boolean
    // Undecided coaches start with adults on and high schoolers off, instead
    // of everything off
    applyOptInDefaults?: boolean
  }>(),
  { showButtons: true, stackedLayout: false, applyOptInDefaults: false }
)

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const store = useStore()

const ALL_FIELDS = SHARE_INFO_FIELDS.map((field) => field.key)

function initialSelection(): ShareInfoFieldKey[] {
  const saved = store.state.user.user.publicProfileKeys as
    | ShareInfoFieldKey[]
    | undefined
    | null
  if (saved != null) return [...saved]
  if (!props.applyOptInDefaults) return []
  // Minors are never opted in by default. Occupation is self-reported and can
  // be stale (graduated coaches still listed as high school), which errs safe.
  const isHighSchoolCoach = (props.info.occupations ?? []).includes(
    VolunteerOccupations.HIGH_SCHOOL_STUDENT
  )
  return isHighSchoolCoach ? [] : [...ALL_FIELDS]
}

function isSameSelection(a: ShareInfoFieldKey[], b: ShareInfoFieldKey[]) {
  return a.length === b.length && a.every((field) => b.includes(field))
}

const selectedFields = ref<ShareInfoFieldKey[]>(initialSelection())
// Whether the selection differs from where it started, so the profile page
// only saves sharing when the coach actually made a choice
const hasChanges = computed(
  () => !isSameSelection(selectedFields.value, initialSelection())
)
const isSaving = ref(false)
const errorMessage = ref('')

function isSelected(key: ShareInfoFieldKey) {
  return selectedFields.value.includes(key)
}

function toggleField(key: ShareInfoFieldKey, checked: boolean) {
  selectedFields.value = checked
    ? [...selectedFields.value, key]
    : selectedFields.value.filter((field) => field !== key)
}

const hasSelection = computed(() => selectedFields.value.length > 0)
const allSelected = computed(() =>
  ALL_FIELDS.every((field) => selectedFields.value.includes(field))
)

function selectAll() {
  selectedFields.value = [...ALL_FIELDS]
}

// Preview the card as students will see it, with only the selected fields
const previewInfo = computed(() =>
  toPublicProfileInfoShared(props.info, selectedFields.value)
)

// On the profile page this form stays mounted (hidden) while the coach saves
// from the share modal, so follow that choice unless they've edited this one
watch(initialSelection, (next, previous) => {
  if (isSameSelection(selectedFields.value, previous)) {
    selectedFields.value = next
  }
})

async function save(fields: ShareInfoFieldKey[]) {
  await UserService.setProfile({ publicProfileKeys: fields }, store)
  selectedFields.value = [...fields]
  AnalyticsService.captureEvent(
    fields.length > 0
      ? EVENTS.VOLUNTEER_SELECTED_TO_SHARE_INFO
      : EVENTS.VOLUNTEER_OPTED_OUT_OF_SHARE_INFO,
    { fields }
  )
  emit('saved')
}

async function saveChoice(fields: ShareInfoFieldKey[]) {
  if (isSaving.value) return
  isSaving.value = true
  errorMessage.value = ''
  try {
    await save(fields)
  } catch (err) {
    LoggerService.noticeError(err)
    errorMessage.value = 'Something went wrong while saving. Please try again.'
  } finally {
    isSaving.value = false
  }
}

defineExpose({
  save: () => save(selectedFields.value),
  hasChanges,
})
</script>

<template>
  <div
    class="share-info-form"
    :class="{ 'share-info-form--stacked': stackedLayout }"
  >
    <div class="preview" :class="{ 'preview--empty': !hasSelection }">
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
      <!-- Hidden rather than removed when everything is on, so toggling
           doesn't change the form's height -->
      <button
        type="button"
        class="select-all-button"
        :class="{ 'select-all-button--hidden': allSelected }"
        :aria-hidden="allSelected"
        :tabindex="allSelected ? -1 : 0"
        data-testid="share-info-select-all"
        @click="selectAll"
      >
        Turn all on
      </button>
    </div>
  </div>
  <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
  <div v-if="showButtons" class="share-info-form-buttons">
    <button
      class="uc-form-button-secondary secondary-button"
      type="button"
      :disabled="isSaving"
      @click="saveChoice([])"
    >
      Don't share anything
    </button>
    <button
      class="uc-form-button"
      type="button"
      :disabled="isSaving"
      @click="saveChoice(selectedFields)"
    >
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

.share-info-form--stacked .preview--empty {
  min-height: 0;
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
  // Sized for the full card so toggling a field doesn't shift the form
  min-height: 220px;
  min-width: 342px;
}

@media (min-width: 801px) {
  .share-info-form:not(.share-info-form--stacked) .preview {
    flex: 0 0 360px;
  }
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

.error {
  margin: 16px 0 0;
  color: $c-error-red;
  text-align: center;
}

.select-all-button--hidden {
  visibility: hidden;
}

.select-all-button {
  background: none;
  border: none;
  padding: 0;
  color: $c-soft-black;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
}
</style>
