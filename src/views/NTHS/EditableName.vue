<script lang="ts" setup>
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { isErrorWithResponse } from '@/utils/error-utils'
import { nextTick, ref } from 'vue'
import { useStore } from 'vuex'
import Pencil from '@/assets/pencil.svg'

const store = useStore()
const props = defineProps<{ groupName: string; groupId: string }>()

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

    store.commit('volunteer/setNTHSGroupName', {
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
  <div class="container">
    <form
      class="name-form"
      v-if="isEditingName"
      @keydown.esc="cancel"
      @submit.prevent="saveGroupName"
    >
      <input
        ref="nameInput"
        :disabled="isSaving"
        class="name-input"
        v-model="newGroupName"
        @input="errorMessage = ''"
      />
      <button
        :disabled="isSaving"
        class="name-button save-button"
        type="submit"
      >
        save
      </button>
      <button
        :disabled="isSaving"
        class="name-button"
        type="button"
        @click="cancel"
      >
        cancel
      </button>
    </form>
    <div class="name-container" v-else>
      <span class="name">{{ props.groupName }}</span>
      <button class="name-button" @click="editGroupName">
        <Pencil class="pencil" />
      </button>
    </div>
    <div class="error" v-if="errorMessage.length">{{ errorMessage }}</div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
}
.name-container {
  display: flex;
  justify-content: start;
  align-items: center;
}
.name {
  font-size: 24px;
  font-weight: 800;
  padding: 0 0 0 4px;
  margin-right: 8px;
}
.name-form {
  display: flex;
  justify-content: center;
  align-items: center;
}
.name-input {
  font-size: 24px;
  font-weight: 800;
  border: none;
  margin-right: 8px;
  padding: 4px;
}
.name-button {
  font-size: 14px;
  display: inline-flex;
  border-radius: 18px;
  padding: 8px 12px;
}
.save-button {
  background: $c-information-blue;
  color: white;
}
.save-button:disabled {
  background: $step-blue;
  color: $c-background-grey;
}
.error {
  color: $c-error-red;
}
.pencil {
  height: 16px;
  width: auto;
  transform: scaleX(-1);
}
.pencil :deep(path) {
  stroke-width: 2px;
  stroke: black;
}
</style>
