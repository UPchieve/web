<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { LANGUAGES } from '@/consts'
import NetworkService from '@/services/NetworkService'
import { debounce } from 'lodash-es'
import { secondsInMs } from '@/utils/time-utils'
import LoggerService from '@/services/LoggerService'
import { useStore } from 'vuex'
import FormSelect from '@/components/FormInputs/FormSelect.vue'

const store = useStore()
const userTutoringLanguages = computed(
  (): string[] => store.state.user.user.tutoringLanguages ?? []
)
const OTHER = 'Other'
const languageOptions = computed((): string[] => {
  // Include whatever "Other" language the user may have supplied
  const l = new Set<string>(LANGUAGES.map((lang) => lang.name))
  userTutoringLanguages.value.forEach((lang) => l.add(lang))
  return Array.from(l).filter((l) => l !== 'English')
})
const selectedOptions = ref<string[]>(userTutoringLanguages.value ?? [])
const selectedLanguages = computed(() => {
  const isOtherSelected = selectedOptions.value.includes(OTHER)
  const languages = [...selectedOptions.value].filter((l) => l !== OTHER)
  if (otherLanguage.value && isOtherSelected) {
    // Don't store the text input for "Other" if they unselect that option
    languages.push(otherLanguage.value)
  }
  return languages
})

// User can select "Other" and input this language
const showAddOtherLanguage = computed(() =>
  selectedOptions.value.includes(OTHER)
)
const otherLanguage = ref<string | null>(null)

// If the update fails, reset to the last state.
const lastConfirmedOtherLanguage = ref<string | null>(null)
const lastConfirmedSelections = ref<string[]>(userTutoringLanguages.value)

const debouncedUpdate = debounce(updateTutoringLanguages, secondsInMs(1.5))
watch([otherLanguage, selectedLanguages], () => {
  debouncedUpdate()
})

async function updateTutoringLanguages() {
  if (
    lastConfirmedSelections.value === selectedOptions.value &&
    lastConfirmedOtherLanguage.value === otherLanguage.value
  ) {
    // no change - don't update
    return
  }
  if (!selectedOptions.value.includes(OTHER) && otherLanguage.value) {
    otherLanguage.value = null
  }
  try {
    await NetworkService.addBackgroundInfo({
      languages: selectedLanguages.value,
    })
    emit('success')
    lastConfirmedSelections.value = selectedOptions.value
    lastConfirmedOtherLanguage.value = otherLanguage.value
    await store.dispatch('user/addToUser', {
      tutoringLanguages: selectedLanguages.value,
    })
  } catch (err) {
    selectedOptions.value = lastConfirmedSelections.value
    otherLanguage.value = lastConfirmedOtherLanguage.value
    LoggerService.noticeError('Failed to update tutoring languages', { err })
    emit('error')
  }
}

const emit = defineEmits<{
  (e: 'error'): void
  (e: 'success'): void
}>()
</script>

<template>
  <div class="tutoring-checklist-main">
    <FormSelect
      name="Tutoring languages"
      :options="languageOptions"
      :multiple="true"
      v-model="selectedOptions"
      label="Select all that apply"
      class="dropdown"
    />
    <input
      type="text"
      v-model="otherLanguage"
      class="uc-form-input other-input"
      v-if="showAddOtherLanguage"
      placeholder="Enter the other language"
      autocomplete="off"
    />
  </div>
</template>

<style lang="scss" scoped>
.tutoring-checklist-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.other-input {
  padding-top: 8px;
  width: 100%;
}

.dropdown {
  padding-top: 16px;
  background-color: white;

  :deep(input) {
    background-color: white;
  }
  :deep(button) {
    background-color: white;
  }
}
</style>
