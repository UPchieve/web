<script lang="ts" setup>
import { useStore } from 'vuex'
import { computed, onMounted, ref } from 'vue'
import { IonToast, toastController } from '@ionic/vue'
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons'
import { useVuelidate } from '@vuelidate/core'
import { dayjs } from '@/utils/time-utils'
import UserService from '@/services/UserService'
import Modal from '@/components/Modal.vue'
import BackButton from '@/components/BackButton.vue'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import { useStepper } from '@/composables/useStepper'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const vuelidate = useVuelidate()
const store = useStore()

const toastMsTimeout = 7000

const schoolId = ref<string | null>(null)

const updateSchoolConfig = computed(
  () => store.getters['featureFlags/getUpdateSchoolConfig']
)

const localStorageKey = computed(() => {
  const userId = store.state.user.user.id
  return updateSchoolConfig.value
    ? `update-school-modal-${userId}-${updateSchoolConfig.value.id}`
    : ''
})

const userHadASession = computed(
  () => store.state.user.user.pastSessions.length >= 1
)

const isValidPeriod = computed(() => {
  const startDate = dayjs(updateSchoolConfig.value.startDate)
  const endDate = dayjs(updateSchoolConfig.value.endDate)
  const usersCurrentDateTime = dayjs()

  return usersCurrentDateTime >= startDate && usersCurrentDateTime <= endDate
})

const didStudentCreateAcctRecently = computed(() => {
  const threshold = dayjs(updateSchoolConfig.value.studentAcctCreationThreshold)
  const studentSignUpDate = dayjs(store.state.user.user.createdAt)

  return studentSignUpDate >= threshold
})

const hasSeenModal = ref(localStorage.getItem(localStorageKey.value))

const showUpdateSchoolModal = computed(() => {
  return (
    updateSchoolConfig.value &&
    isValidPeriod.value &&
    !hasSeenModal.value &&
    userHadASession.value &&
    !didStudentCreateAcctRecently.value
  )
})

const currentSchool = computed(() => store.state.user.user.schoolName)

const { currentStep, nextStep, prevStep, goToStep } = useStepper(ref<number>(3))
onMounted(() => {
  if (!currentSchool.value) return goToStep(2)
})

const successMessage = ref<string>()
const STEP_TO_SUCCESS_MESSAGES = {
  1: 'Thanks for confirming',
  2: 'Your school has been updated',
}
async function handleLastStep() {
  if (currentStep.value === 2) {
    try {
      await UserService.setProfile(
        {
          userId: store.state.user.user.id,
          schoolId: schoolId.value,
        },
        store
      )
      AnalyticsService.captureEvent(EVENTS.UPDATE_SCHOOL_MODAL_CHANGED, {
        previousSchool: currentSchool.value,
        newSchoolId: schoolId.value,
      })
    } catch (err) {
      const toast = await toastController.create({
        color: 'danger',
        position: 'bottom',
        animated: true,
        icon: closeCircleOutline,
        duration: toastMsTimeout,
        message:
          "Couldn't save your school at this time. Please try again later.",
        swipeGesture: 'vertical',
        buttons: [
          {
            text: 'X',
            role: 'cancel',
          },
        ],
      })
      await toast.present()
      LoggerService.noticeError(err)
      AnalyticsService.captureEvent(EVENTS.UPDATE_SCHOOL_MODAL_FAILED)
      return
    }
  }

  setSuccessMessage(currentStep.value)
  if (currentStep.value == 1)
    AnalyticsService.captureEvent(EVENTS.UPDATE_SCHOOL_MODAL_NOT_CHANGED, {
      currentSchool,
    })
  handleModalClose(false)
  goToStep(3)
}

function setSuccessMessage(currentStep: number) {
  const step = currentStep as keyof typeof STEP_TO_SUCCESS_MESSAGES
  successMessage.value = STEP_TO_SUCCESS_MESSAGES[step]
}

function handleModalClose(ignoredModal: boolean) {
  localStorage.setItem(localStorageKey.value, 'true')
  hasSeenModal.value = 'true'
  if (ignoredModal)
    AnalyticsService.captureEvent(EVENTS.UPDATE_SCHOOL_MODAL_IGNORED)
}
</script>

<template>
  <div v-if="currentStep !== 3">
    <modal
      v-if="showUpdateSchoolModal"
      :disableModalMobileMode="true"
      :closeModal="() => handleModalClose(true)"
    >
      <template v-if="currentStep === 1">
        <div class="uc-column">
          <h1 class="heading">Are you still attending this school?</h1>

          <label class="step-1-description">
            Current School:
            <p class="step-1-description-school bold">{{ currentSchool }}</p>
          </label>

          <p>We check to keep your profile accurate.</p>
        </div>
        <div class="upc-modal-buttons">
          <button
            class="uc-form-button-secondary secondary-button"
            type="button"
            @click="handleLastStep"
          >
            Yes, that's correct
          </button>
          <button class="uc-form-button" type="button" @click="nextStep">
            No, I changed schools
          </button>
        </div>
      </template>
      <template v-else-if="currentStep === 2">
        <h1 class="heading">Let's update your school info</h1>
        <FormSchoolSearch
          label="Please enter the name of your new school below."
          placeholder="Start typing to search"
          v-model="schoolId"
        />
        <div class="upc-modal-buttons">
          <back-button class="flex-1" @click="prevStep" />

          <button
            type="button"
            class="uc-form-button flex-1"
            @click="handleLastStep"
            :disabled="vuelidate.$errors.length > 0 || !!!schoolId"
          >
            Update School
          </button>
        </div>
      </template>
    </modal>
  </div>

  <ion-toast
    v-else-if="currentStep === 3"
    :animated="true"
    :icon="checkmarkCircleOutline"
    :isOpen="true"
    :duration="toastMsTimeout"
    :message="successMessage"
    position="bottom"
    swipeGesture="vertical"
    :buttons="[
      {
        text: 'X',
        role: 'cancel',
      },
    ]"
    color="success"
  />
</template>
<style lang="scss" scoped>
.heading {
  font-size: 1.5rem;
}
.step-1-description {
  margin-top: 8px;
  font-size: 0.8rem;
}

.step-1-description-school {
  font-size: 1rem;
}

.secondary-button {
  font-weight: 600;
  width: 100%;
  margin-top: 24px;
  display: flex;
  place-content: center;
  place-items: center;
}
</style>
