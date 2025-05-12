<template>
  <modal :close-modal="props.closeModal">
    <div class="join-class-modal">
      <form-errors v-if="errorMessage" :errors="[errorMessage]" />

      <h1>Join class</h1>

      <p>Have a teacher code? Join your class by entering the code below!</p>
      <FormInput
        class="mt-3"
        v-model="classCode"
        name="classCode"
        label="Class Code"
        placeholder="Class Code"
        :blur-event="EVENTS.STUDENT_ENTERED_CLASS_CODE"
        :is-required="askForClassCode"
      />
      <button
        class="uc-form-button"
        type="submit"
        @click="addStudentToClass"
        :disabled="isDisabled"
        data-testid="button-submit"
      >
        Join Class
      </button>
    </div>
  </modal>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import Modal from '@/components/Modal.vue'
import FormInput from '@/components/FormInput.vue'
import FormErrors from '@/components/FormErrors.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const $store = useStore()
const $router = useRouter()

const classCode = ref<string>('')
const gradeLevel = ref<string>($store.state.user.user?.gradeLevel)
const email = ref<string>($store.state.user.user?.email)

const errorMessage = ref<string>('')

const v$ = useVuelidate()
const isDisabled = computed(() => {
  return v$.value.$error || !!v$.value.$silentErrors?.length
})

const props = defineProps({
  closeModal: { type: Function, required: true },
})

async function addStudentToClass() {
  try {
    const response = await NetworkService.addStudentToClass({
      email: email.value,
      classCode: classCode.value,
      gradeLevel: gradeLevel.value,
    })

    if (response.data.teacherClass) {
      AnalyticsService.captureEvent(EVENTS.STUDENT_JOINED_CLASS, {
        classCode: classCode.value,
      })
      return $router.go(0)
    }
  } catch (err: any) {
    const INPUT_ERROR_STATUS_CODE = 422
    if (err.response?.status === INPUT_ERROR_STATUS_CODE) {
      errorMessage.value = `Invalid class code ${classCode.value}. Please double check the class code you have entered.`
    } else {
      errorMessage.value =
        err.response?.data?.err ??
        'Something went wrong. Please refresh the page and try again.'
    }
  }
}

const askForClassCode = ref<boolean>(!classCode.value)
</script>
