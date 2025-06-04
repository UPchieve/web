<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { EVENTS } from '@/consts'
import FormInput from '@/components/FormInput.vue'
import IonicSelect from '@/components/IonicSelect.vue'
import AnalyticsService from '@/services/AnalyticsService'
import type { Language } from '@/types/languages'

const languages: Language[] = [
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'zh', name: 'Chinese' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'fa', name: 'Persian (Farsi)' },
  { code: 'fil', name: 'Filipino' },
  { code: 'ru', name: 'Russian' },
  { code: 'sw', name: 'Swahili' },
  { code: 'es', name: 'Spanish' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'other', name: 'Other' },
]

const preferredLanguage = ref<Language | undefined>(undefined)
const otherLanguageInput = ref('')

const props = defineProps({
  userPreferredLanguage: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const v$ = useVuelidate()

const languageError = computed(() => {
  if (
    preferredLanguage.value?.code === 'other' &&
    !otherLanguageInput.value.trim()
  )
    return 'Please enter a language name'

  return ''
})

const isLanguageValid = computed(
  () => !languageError.value && !v$.value.$invalid
)

const selectedLanguage = computed<Language | undefined>(() => {
  if (!preferredLanguage.value) return
  if (preferredLanguage.value.code === 'other')
    return {
      ...preferredLanguage.value,
      name: otherLanguageInput.value,
    }

  return preferredLanguage.value
})

function onLanguageSelect(languageName: string) {
  const language = languages.find((lang) => lang.name === languageName)
  if (!language) return

  otherLanguageInput.value = ''
  preferredLanguage.value = language
  AnalyticsService.captureEvent(EVENTS.USER_SELECTED_PREFERRED_LANGUAGE, {
    language,
  })
}

function onOtherLanguage(languageName: string) {
  otherLanguageInput.value = languageName.trim()
}

onMounted(() => {
  if (props.userPreferredLanguage) {
    const language = languages.find(
      (language) => language.name === props.userPreferredLanguage
    )

    if (language) preferredLanguage.value = language
    else {
      preferredLanguage.value = {
        code: 'other',
        name: 'Other',
      }
      otherLanguageInput.value = props.userPreferredLanguage
    }
  }
})

defineExpose({
  selectedLanguage,
  isLanguageValid,
})
</script>

<template>
  <div>
    <ionic-select
      @update:modelValue="onLanguageSelect"
      :modelValue="preferredLanguage?.name"
      name="preferred-language-select"
      :options="languages"
      placeholder="Select a language..."
      :disabled="disabled"
      optionTextField="name"
      :reduce="(option: Language) => option.name"
    />
    <form-input
      v-if="preferredLanguage?.code === 'other'"
      v-model="otherLanguageInput"
      placeholder="Enter your preferred language"
      @update:modelValue="onOtherLanguage"
      :readOnly="disabled"
      :minLength="2"
      :customError="languageError"
    />
  </div>
</template>
