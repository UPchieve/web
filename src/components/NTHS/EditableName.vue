<script lang="ts" setup>
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { isErrorWithResponse } from '@/utils/error-utils'
import { nextTick, ref } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '../LargeButton.vue'

const store = useStore()
const props = defineProps<{
  groupName: string
  groupId: string
}>()

const isEditingName = ref(false)
const newGroupName = ref(props.groupName)
const nameInput = ref()
const errorMessage = ref('')
const isSaving = ref(false)

function cancel() {
  isEditingName.value = false
  newGroupName.value = props.groupName
  errorMessage.value = ''
}

function editGroupName() {
  isEditingName.value = true
  newGroupName.value = props.groupName
  nextTick(() => {
    nameInput.value.focus()
  })
}

async function saveGroupName() {
  isSaving.value = true
  try {
    const result = await NetworkService.editNTHSGroup({
      groupId: props.groupId,
      name: newGroupName.value,
    })

    store.commit('nths/setNTHSGroupName', {
      groupId: props.groupId,
      groupName: result.data.group.name,
    })
    isEditingName.value = false
  } catch (e) {
    if (isErrorWithResponse(e)) {
      if (e.response.data.err.includes('Team name must be unique')) {
        errorMessage.value = e.response.data.err
      } else {
        errorMessage.value = `Unknown error, please try again: ${e.response.data.err}`
        LoggerService.noticeError(e.response.data.err)
      }
    } else {
      errorMessage.value = 'Unknown error, please try again'
      LoggerService.noticeError(e)
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="editable-name">
    <label class="label">Team name</label>
    <form
      class="name-form"
      @keydown.esc="cancel"
      @submit.prevent="saveGroupName"
      autocomplete="off"
    >
      <input
        ref="nameInput"
        id="nths-group-name"
        :disabled="isSaving || !isEditingName"
        class="name-input"
        v-model="newGroupName"
        type="text"
        @input="errorMessage = ''"
        autocomplete="off"
      />
      <div class="buttons">
        <LargeButton
          v-if="isEditingName"
          :disabled="isSaving"
          type="button"
          :show-arrow="false"
          variant="text"
          @click="cancel"
        >
          cancel
        </LargeButton>
        <LargeButton
          v-if="isEditingName"
          :disabled="isSaving"
          type="submit"
          variant="primary-blue"
          :show-arrow="false"
        >
          save
        </LargeButton>
        <LargeButton
          v-if="!isEditingName"
          @click="editGroupName"
          type="button"
          variant="text"
          :show-arrow="false"
          class="edit-button"
        >
          edit
        </LargeButton>
      </div>
    </form>
    <div class="error" v-if="errorMessage.length">{{ errorMessage }}</div>
  </div>
</template>

<style lang="scss" scoped>
.editable-name {
  --size: 18px;
  --weight: 500;
  --spacing: 8px;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
}
.name-container {
  display: flex;
  justify-content: start;
  align-items: center;
}
.label {
  flex-grow: 0;
  flex-shrink: 0;
  margin-right: var(--spacing);
}
.name {
  font-size: var(--size);
  font-weight: var(--weight);
  padding: 11px 18px;
  margin-right: var(--spacing);
  line-height: 1;
}
.name-form {
  display: flex;
  justify-content: start;
  align-items: center;
  width: 100%;
  flex-direction: column;
  gap: 8px;
}
.buttons {
  display: flex;
  justify-content: end;
  width: 100%;
}
.edit-button {
  // keep from from jumping
  border: 2px solid transparent;
}
.name-input {
  font-size: var(--size);
  font-weight: var(--weight);
  border: none;
  padding: 9px 18px;
  margin-right: var(--spacing);
  field-sizing: content;
  line-height: 1;
}
.error {
  color: $c-error-red;
}
</style>
