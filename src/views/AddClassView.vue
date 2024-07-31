<script lang="ts" setup>
import { onBeforeMount, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { GRADES, EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import FormEmail from '@/components/FormEmail.vue'
import FormInput from '@/components/FormInput.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import FormSelect from '@/components/FormSelect.vue'
import Loader from '@/components/Loader.vue'

const $store = useStore()
const $route = useRoute()
const $router = useRouter()

$store.dispatch('app/hideNavigation')
const isAuthenticated = computed(() => $store.getters['user/isAuthenticated'])
const user = computed<{ email: string } | undefined>(
  () => $store.state.user.user
)

const email = ref<String | undefined>($route.query.email ?? user.value?.email)
const classCode = ref<String | undefined>(
  $route.query.code ?? $route.query.classCode
)
const gradeLevel = ref<String | undefined>($route.query.gradeLevel)
const isLoading = ref(false)

onBeforeMount(async () => {
  if (email.value && classCode.value && gradeLevel.value) {
    await addStudentToClass()
  }
})

async function addStudentToClass() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_ADD_CLASS)

  isLoading.value = true
  try {
    const response = await NetworkService.addStudentToClass({
      email: email.value ?? user.value?.email,
      classCode: classCode.value,
      gradeLevel: gradeLevel.value,
    })

    if (response.data.teacherClass) {
      // TODO: Show modal once get to dashboard.
      return $router.replace(`/dashboard?classCode=${classCode.value}`)
    }

    const params = new URLSearchParams({
      email: (email.value ?? user.value?.email) as string,
      classCode: classCode.value as string,
      gradeLevel: gradeLevel.value as string,
    })
    if (response.data.isExistingStudent) {
      const redirectUriParams = new URLSearchParams({
        redirect: `/class?${params.toString()}`,
        message: 'Sign in to finish adding yourself to the class.',
      })
      // TODO: Show message to login in order to complete.
      $router.replace('/login?' + redirectUriParams.toString())
    } else {
      // TODO: Show message to finish creating account.
      $router.replace({
        path: '/sign-up/student/account?' + params.toString(),
        query: {
          isEligible: 'true',
        },
      })
    }
  } catch {
    // TODO: Show errors.
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form-page-template>
    <loader v-if="isLoading" overlay />

    <h1>Add yourself to a class</h1>
    <FormEmail v-if="!isAuthenticated" v-model="email" />
    <div v-else class="uc-row justify-between">
      <div>Adding class for {{ user?.email }}</div>
    </div>
    <FormInput
      v-model="classCode"
      name="classCode"
      label="Class Code"
      placeholder="Class Code"
      :blur-event="EVENTS.STUDENT_ENTERED_CLASS_CODE"
    />
    <FormSelect
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
h1 {
  font-size: 2rem;
}
</style>
