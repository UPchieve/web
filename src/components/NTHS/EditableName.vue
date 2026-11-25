<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { isErrorWithResponse } from '@/utils/error-utils'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useNthsStore } from '@/stores/nths'

const UPDATED_MESSAGE_MS = 2500
const MAX_LENGTH = 64
const COUNTER_FROM_LENGTH = MAX_LENGTH - 10

const nths = useNthsStore()
const props = defineProps<{
  groupName: string
  groupId: string
}>()

const name = ref(props.groupName)
const errorMessage = ref('')
const saving = ref(false)
const updated = ref(false)
let updatedTimer: ReturnType<typeof setTimeout> | undefined

const showLength = computed(() => name.value.length >= COUNTER_FROM_LENGTH)
const describedBy = computed(
  () =>
    [
      errorMessage.value && 'nths-group-name-error',
      showLength.value && 'nths-group-name-length',
    ]
      .filter(Boolean)
      .join(' ') || undefined
)

const canSave = computed(() => {
  const trimmed = name.value.trim()
  return !saving.value && !!trimmed && trimmed !== props.groupName
})

watch(
  () => props.groupName,
  (saved) => {
    name.value = saved
  }
)

onBeforeUnmount(() => clearTimeout(updatedTimer))

function onInput() {
  errorMessage.value = ''
  updated.value = false
}

async function save() {
  if (!canSave.value) return
  const trimmed = name.value.trim()
  saving.value = true
  errorMessage.value = ''
  try {
    const result = await NetworkService.editNTHSGroup({
      groupId: props.groupId,
      name: trimmed,
    })
    nths.setNTHSGroupName({
      groupId: props.groupId,
      groupName: result.data.group.name,
    })
    updated.value = true
    clearTimeout(updatedTimer)
    updatedTimer = setTimeout(() => (updated.value = false), UPDATED_MESSAGE_MS)
  } catch (e) {
    if (
      isErrorWithResponse(e) &&
      e.response.data?.err?.includes('Team name must be unique')
    ) {
      errorMessage.value = e.response.data.err
    } else {
      // Raw server text isn't fit for presidents to read. A proxy 502/504 sends an
      // HTML body, so data.err can be missing.
      errorMessage.value = 'Unknown error, please try again'
      LoggerService.noticeError(
        isErrorWithResponse(e) ? (e.response.data?.err ?? e) : e
      )
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form
    class="editable-name"
    autocomplete="off"
    data-testid="name-form"
    @submit.prevent="save"
  >
    <label class="label" for="nths-group-name">Chapter name</label>
    <div class="row">
      <input
        id="nths-group-name"
        data-testid="name-input"
        v-model="name"
        class="name-input"
        type="text"
        autocomplete="off"
        :maxlength="MAX_LENGTH"
        placeholder="NTHS at Lincoln High School"
        v-ph:nthshq="'setup.rename'"
        :readonly="saving"
        :aria-invalid="!!errorMessage"
        :aria-describedby="describedBy"
        @input="onInput"
      />
      <LargeButton
        class="save"
        variant="secondary"
        type="submit"
        :showArrow="false"
        :disabled="!canSave"
        data-testid="save-name-button"
        v-ph:nthshq="'setup.rename_save'"
        >Save name</LargeButton
      >
    </div>
    <p class="feedback" aria-live="polite" data-testid="name-feedback">
      <span v-if="errorMessage" id="nths-group-name-error" class="error">
        {{ errorMessage }}
      </span>
      <span v-else-if="updated">Chapter name updated.</span>
    </p>
    <p
      v-if="showLength"
      id="nths-group-name-length"
      class="counter"
      data-testid="name-length"
    >
      {{ name.length }}/{{ MAX_LENGTH
      }}<span class="visually-hidden"> characters</span>
    </p>
  </form>
</template>

<style lang="scss" scoped>
.editable-name {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
}
// The setup card's question is the visible label for this input.
.label {
  @include visually-hidden;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.name-input {
  flex: 1 1 240px;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid $border-grey;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.3;
  color: $c-soft-black;
  background: $upchieve-white;
}
.name-input:focus {
  border-color: $c-information-blue;
  outline: none;
}
.name-input::placeholder {
  color: $c-disabled-grey;
}
// Reserves a line so the card does not jump when a message appears.
.feedback {
  min-height: 20px;
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: $c-secondary-grey;
}
.error {
  color: $c-error-red;
}
.counter {
  margin: -20px 0 0;
  align-self: flex-end;
  font-size: 14px;
  line-height: 20px;
  color: $c-secondary-grey;
}
.visually-hidden {
  @include visually-hidden;
}
</style>
