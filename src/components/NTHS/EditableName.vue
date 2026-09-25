<script lang="ts" setup>
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { isErrorWithResponse } from '@/utils/error-utils'
import { ref, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const props = defineProps<{
  groupName: string
  groupId: string
}>()

const name = ref(props.groupName)
const errorMessage = ref('')
const status = ref<'idle' | 'saving' | 'saved'>('idle')
// A rejected value is re-sent on every later blur unless it's remembered here -
// the field keeps the text but isn't touched again until it changes.
const lastRejectedValue = ref<string>()

watch(
  () => props.groupName,
  (saved) => {
    name.value = saved
  }
)

function onInput() {
  errorMessage.value = ''
  status.value = 'idle'
  lastRejectedValue.value = undefined
}

function revert() {
  name.value = props.groupName
  errorMessage.value = ''
}

function revertOnEscape() {
  // The in-flight save will commit and overwrite this anyway, so reverting
  // here would just flash the old name before the save resolves.
  if (status.value === 'saving') return
  revert()
}

function blurOnEnter(event: KeyboardEvent) {
  ;(event.target as HTMLInputElement).blur()
}

async function save() {
  if (status.value === 'saving') return
  const trimmed = name.value.trim()
  if (trimmed === props.groupName) {
    name.value = props.groupName
    return
  }
  if (!trimmed) {
    revert()
    errorMessage.value = 'Your chapter needs a name.'
    return
  }
  if (trimmed === lastRejectedValue.value) return

  status.value = 'saving'
  try {
    const result = await NetworkService.editNTHSGroup({
      groupId: props.groupId,
      name: trimmed,
    })
    store.commit('nths/setNTHSGroupName', {
      groupId: props.groupId,
      groupName: result.data.group.name,
    })
    status.value = 'saved'
  } catch (e) {
    status.value = 'idle'
    if (
      isErrorWithResponse(e) &&
      e.response.data?.err?.includes('Team name must be unique')
    ) {
      errorMessage.value = e.response.data.err
      lastRejectedValue.value = trimmed
    } else {
      // Raw server text isn't fit for presidents to read. A proxy 502/504 sends an
      // HTML body, so data.err can be missing.
      errorMessage.value = 'Unknown error, please try again'
      LoggerService.noticeError(
        isErrorWithResponse(e) ? (e.response.data?.err ?? e) : e
      )
    }
  }
}
</script>

<template>
  <div class="editable-name">
    <label class="label" for="nths-group-name">Chapter name</label>
    <input
      id="nths-group-name"
      v-model="name"
      class="name-input"
      type="text"
      autocomplete="off"
      placeholder="NTHS at Lincoln High School"
      v-ph:nthshq="'setup.rename'"
      :readonly="status === 'saving'"
      :aria-invalid="!!errorMessage"
      :aria-describedby="errorMessage ? 'nths-group-name-error' : undefined"
      @input="onInput"
      @blur="save"
      @keydown.enter.prevent="blurOnEnter"
      @keydown.esc="revertOnEscape"
    />
    <p class="feedback" aria-live="polite" data-testid="name-feedback">
      <span v-if="errorMessage" id="nths-group-name-error" class="error">
        {{ errorMessage }}
      </span>
      <span v-else-if="status === 'saving'">Saving…</span>
      <span v-else-if="status === 'saved'">Saved</span>
    </p>
  </div>
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
.name-input {
  width: 100%;
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
</style>
