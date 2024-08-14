<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue'
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
import useVuelidate from '@vuelidate/core'

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

const v$ = useVuelidate()
const isDisabled = computed(() => {
  return v$.value.$error || !!v$.value.$silentErrors?.length
})

onBeforeMount(async () => {
  FeatureFlagService.setPersonPropertiesForFlags({ cohort: 'joining-class' })

  if (email.value && classCode.value && gradeLevel.value) {
    await addStudentToClass(undefined, EVENTS.STUDENT_REDIRECTED_TO_JOIN_CLASS_WITH_PARAMS)
  }
})

function removeClass() {
  askForClassCode.value = true
  classCode.value = ''
  $router.replace('/join-class')
}

async function addStudentToClass(_, overrideEvent?: string) {
  AnalyticsService.captureEvent(
    overrideEvent ?? EVENTS.STUDENT_CLICKED_JOIN_CLASS,
    {
      classCode: classCode.value,
    }
  )

  isLoading.value = true
  try {
    const response = await NetworkService.addStudentToClass({
      email: email.value,
      classCode: classCode.value,
      gradeLevel: gradeLevel.value,
    })

    if (response.data.teacherClass) {
      // TODO: Show modal once get to dashboard.
      AnalyticsService.captureEvent(EVENTS.STUDENT_JOINED_CLASS, {
        classCode: classCode.value,
      })
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
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_JOIN_CLASS_REDIRECT_TO_LOGIN,
        {
          classCode: classCode.value,
        }
      )
      $router.push('/login?' + redirectUriParams.toString())
    } else {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_JOIN_CLASS_REDIRECT_TO_SIGN_UP,
        {
          classCode: classCode.value,
        }
      )
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
      :is-required="askForClassCode"
      testid="input-class-code"
    />
    <div v-else class="uc-row mt-2">
      <p data-testid="text-class-code">Class code: {{ classCode }}</p>
      <a
        class="uc-link ml-2"
        data-testid="link-not-your-class"
        @click="removeClass"
        >Not your class?</a
      >
    </div>

    <FormEmail
      class="mt-3"
      v-model="email"
      :blur-event="EVENTS.STUDENT_ENTERED_EMAIL_ON_JOIN_CLASS"
      testid="input-email"
    />

    <FormSelect
      class="mt-3"
      v-model="gradeLevel"
      name="gradeLevel"
      label="Grade in 2024-2025"
      placeholder="Grade in 2024-2025"
      :get-select-options="() => GRADES"
      :reduce="(option: string) => option.split(' ')[0]"
      :blur-event="EVENTS.STUDENT_SELECTED_GRADE_ON_JOIN_CLASS"
      testid="select-grade"
    />

    <button
      class="uc-form-button"
      type="submit"
      @click="addStudentToClass"
      :disabled="isDisabled"
      data-testid="button-submit"
    >
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
