<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { GRADES, EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import FeatureFlagService from '@/services/FeatureFlagService'
import NetworkService from '@/services/NetworkService'
import FormEmail from '@/components/FormEmail.vue'
import FormErrors from '@/components/FormErrors.vue'
import FormInput from '@/components/FormInput.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import FormSelect from '@/components/FormSelect.vue'
import Loader from '@/components/Loader.vue'

const $store = useStore()
const $route = useRoute()
const $router = useRouter()

$store.dispatch('app/hideNavigation')

const errorMessage = ref<string>('')
const email = ref<string | undefined>($route.query.email as string)
const classCode = ref<string | undefined>(
  ($route.params.classCode as string)?.toUpperCase()
)
const askForClassCode = ref<boolean>(!classCode.value)
const gradeLevel = ref<string | undefined>($route.query.gradeLevel as string)
const isLoading = ref(false)

onBeforeMount(async () => {
  FeatureFlagService.setPersonPropertiesForFlags({ cohort: 'joining-class' })

  if (email.value && classCode.value && gradeLevel.value) {
    await addStudentToClass()
  }
})

function removeClass() {
  askForClassCode.value = true
  classCode.value = ''
  $router.replace('/join-class')
}

async function addStudentToClass() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_ADD_CLASS)

  isLoading.value = true
  try {
    const response = await NetworkService.addStudentToClass({
      email: email.value,
      classCode: classCode.value,
      gradeLevel: gradeLevel.value,
    })

    if (response.data.teacherClass) {
      // TODO: Show modal once get to dashboard.
      return $router.push(`/dashboard?classCode=${classCode.value}`)
    }

    const data = {
      email: email.value as string,
      classCode: classCode.value as string,
      gradeLevel: gradeLevel.value as string,
    }
    if (response.data.isExistingStudent) {
      const redirectUriParams = new URLSearchParams({
        redirect: `/join-class/${classCode.value}?${new URLSearchParams(data).toString()}`,
        email: email.value as string,
        message: 'Sign in to finish joining your class!',
      })
      $router.push('/login?' + redirectUriParams.toString())
    } else {
      $router.push({
        name: 'SignupView',
        params: {
          userType: 'student',
          step: 'account',
        },
        query: data,
      })
    }
  } catch (err) {
    errorMessage.value =
      err.response?.data?.err ??
      'Something went wrong. Please refresh the page and try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form-page-template>
    <loader v-if="isLoading" overlay />

    <form-errors v-if="errorMessage" :errors="[errorMessage]" />

    <h1>Join your class!</h1>
    <p>
      When you join a class, your teacher will get access to information about
      your UPchieve usage.
    </p>

    <FormInput
      v-if="askForClassCode"
      class="mt-3"
      v-model="classCode"
      name="classCode"
      label="Class Code"
      placeholder="Class Code"
      :blur-event="EVENTS.STUDENT_ENTERED_CLASS_CODE"
    />
    <div v-else class="uc-row mt-2">
      <p>Class code: {{ classCode }}</p>
      <a class="uc-link ml-2" @click="removeClass">Not your class?</a>
    </div>

    <FormEmail class="mt-3" v-model="email" />

    <FormSelect
      class="mt-3"
      v-model="gradeLevel"
      name="gradeLevel"
      label="Grade in 2024-2025"
      placeholder="Grade in 2024-2025"
      :get-select-options="() => GRADES"
      :reduce="(option: string) => option.split(' ')[0]"
      :blur-event="EVENTS.STUDENT_SELECTED_GRADE"
    />

    <button class="uc-form-button" type="submit" @click="addStudentToClass">
      Continue
    </button>
  </form-page-template>
</template>

<style lang="scss" scoped>
form-page-template {
  padding: 50px;
}
h1 {
  font-size: 2rem;
}

p {
  color: #666f7d;
  margin-bottom: 0;
}

.uc-form-button {
  margin-top: 3rem;
}
</style>
