<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { EVENTS, LANGUAGES } from '@/consts'
import FormInput from '@/components/FormInput.vue'
import FormSelect from './FormInputs/FormSelect.vue'
import AnalyticsService from '@/services/AnalyticsService'
import type { Language } from '@/types/languages'
import UserService from '@/services/UserService'
import { useStore } from 'vuex'

const store = useStore()

const emit = defineEmits<{
  (e: 'error', err: any): void
}>()

const preferredLanguage = ref<Language | undefined>(undefined)
const otherLanguageInput = ref('')

const props = defineProps({
  userPreferredLanguage: {
    type: String,
    required: true,
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

async function onLanguageSelect(languageName: string) {
  const language = LANGUAGES.find((lang) => lang.name === languageName)
  if (!language) return

  const previousSelection = preferredLanguage.value
  otherLanguageInput.value = ''
  preferredLanguage.value = language
  AnalyticsService.captureEvent(EVENTS.USER_SELECTED_PREFERRED_LANGUAGE, {
    language,
  })
  try {
    await UserService.setProfile(
      {
        preferredLanguage: preferredLanguage.value?.name,
      },
      store
    )
    await store.dispatch('user/addToUser', {
      preferredLanguage: preferredLanguage.value?.name,
    })
  } catch (err) {
    preferredLanguage.value = previousSelection
    emit('error', err)
  }
}

function onOtherLanguage(languageName: string) {
  otherLanguageInput.value = languageName.trim()
}

onMounted(() => {
  if (props.userPreferredLanguage) {
    const language = LANGUAGES.find(
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
    <form-select
      @update:modelValue="onLanguageSelect"
      :modelValue="preferredLanguage?.name"
      name="preferred-language-select"
      :options="LANGUAGES"
      placeholder="Select a language..."
      optionTextField="name"
      :reduce="(option: Language) => option.name"
    />
    <form-input
      v-if="preferredLanguage?.code === 'other'"
      v-model="otherLanguageInput"
      placeholder="Enter your preferred language"
      @update:modelValue="onOtherLanguage"
      :minLength="2"
      :customError="languageError"
    />
  </div>
</template>
