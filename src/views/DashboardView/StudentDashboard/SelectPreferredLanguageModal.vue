<script setup lang="ts">
import { IonToast } from '@ionic/vue'
import { checkmarkCircleOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { EVENTS } from '@/consts'
import CrossIcon from '@/assets/cross.svg'
import InformationIcon from '@/assets/information.svg'
import LargeButton from '@/components/LargeButton.vue'
import Loader from '@/components/Loader.vue'
import Modal from '@/components/Modal.vue'
import PreferredLanguageSelect from '@/components/PreferredLanguageSelect.vue'
import { useStepper } from '@/composables/useStepper'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import type { PreferredLanguageSelectRef } from '@/types/languages'

const props = defineProps({
  closeModal: {
    type: Function,
    required: true,
  },
})

const toastDuration = 5000
const store = useStore()
const totalSteps = ref<number>(2)
const { currentStep, nextStep } = useStepper(totalSteps)
const error = ref('')
const isSubmitting = ref(false)
const loadingMessage = ref('')
const user = computed(() => store.state.user.user)
const preferredLanguageSelectRef = ref<PreferredLanguageSelectRef | undefined>(
  undefined
)

const toastButtons = computed(() => {
  return [
    {
      text: 'X',
      role: 'cancel',
    },
  ]
})

function handleSkipForNow() {
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_CLICKED_SKIP_FOR_NOW_SELECT_PREFERRED_LANGUAGE_MODAL
  )
  handleClose()
}

function handleClose() {
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_CLOSED_SELECT_PREFERRED_LANGUAGE_MODAL
  )
  props.closeModal()
}

async function handleLanguageSubmitted() {
  const existingLanguage = user.value.preferredLanguage

  if (
    !preferredLanguageSelectRef.value?.selectedLanguage.name &&
    !existingLanguage
  ) {
    error.value = 'Please select a language from the dropdown'
    return
  }

  if (!preferredLanguageSelectRef.value?.isLanguageValid) {
    error.value = 'Please enter a language name'
    return
  }

  const languageToSave =
    preferredLanguageSelectRef.value.selectedLanguage.name ?? existingLanguage

  try {
    error.value = ''
    await NetworkService.updateUserPreferredLanguage(languageToSave)
    store.dispatch('user/addToUser', {
      preferredLanguage: languageToSave,
    })
    nextStep()
    setTimeout(() => {
      props.closeModal()
    }, toastDuration)
  } catch (err) {
    error.value = (err as Error).message
  }
}

onMounted(() => {
  localStorage.setItem('seenSelectPreferredLanguageModal', 'true')
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_SHOWN_SELECT_PREFERRED_LANGUAGE_MODAL
  )
})
</script>

<template>
  <div>
    <div v-if="currentStep === 1">
      <modal :backText="''" class="preferred-language-modal">
        <cross-icon class="cross-icon" @click="handleClose" />

        <loader
          v-if="isSubmitting"
          :message="loadingMessage"
          class="preferred-language-modal__loader"
        />

        <section v-else>
          <section>
            <span class="globe-emoji">🌏</span>
            <h1 class="preferred-language-modal__title">
              Which language would you feel most comfortable using on UPchieve?
            </h1>

            <p
              class="preferred-language-modal__subtitle preferred-language-modal__subtitle-info"
            >
              <information-icon class="information-icon" /> UPchieve will still
              stay in English for now.
            </p>

            <p class="preferred-language-modal__subtitle">
              We're just asking what language you'd feel most comfortable using
              for tutoring and messages in the future.
            </p>

            <div>
              <p class="prompt">
                <b>Choose the language you'd be most comfortable using:</b>
              </p>
              <preferred-language-select
                ref="preferredLanguageSelectRef"
                :userPreferredLanguage="user.preferredLanguage ?? undefined"
                class="preferred-language-select"
              />
            </div>
          </section>

          <p class="error" v-if="error">{{ error }}</p>

          <footer>
            <div class="preferred-language-buttons">
              <large-button
                class="preferred-language-buttons__button preferred-language-buttons__button--primary"
                @click="handleLanguageSubmitted"
                primary
                :showArrow="false"
                :disabled="!preferredLanguageSelectRef?.isLanguageValid"
              >
                Save Language Preference
              </large-button>
              <large-button
                variant="link-style"
                class="preferred-language-buttons__button"
                @click="handleSkipForNow"
              >
                Skip for now
              </large-button>
            </div>
          </footer>
        </section>
      </modal>
    </div>
    <ion-toast
      v-else-if="currentStep === 2"
      :animated="true"
      :header="'Language preference saved.'"
      :icon="checkmarkCircleOutline"
      :isOpen="true"
      :duration="toastDuration"
      :message="'You can change this anytime in your profile.'"
      position="bottom"
      swipeGesture="vertical"
      :buttons="toastButtons"
      color="success"
    />
  </div>
</template>

<style lang="scss">
.information-icon {
  & path {
    fill: $c-information-blue;
  }
}
</style>

<style lang="scss" scoped>
$lightened-success: lighten($c-success-green, 50%);

.globe-emoji {
  font-size: 40px;
}

.preferred-language-modal {
  &__title {
    @include font-category('display-small');
    color: $c-soft-black;
    margin: 0.5em 0;
  }

  &__subtitle {
    @include font-category('helper-text');

    &-info {
      @include flex-container(row, center, center);
      font-weight: 500;
    }
  }
}

.preferred-language-buttons {
  @include flex-container(row, center, center);
  flex-wrap: wrap;
  margin: 2em 0;

  &__button {
    width: 70%;

    &--primary {
      background-color: $c-information-blue;
      margin-bottom: 1em;

      &:hover {
        background: darken($c-information-blue, 5%);
      }
    }
  }
}

.cross-icon {
  display: inline-block;
  cursor: pointer;
  fill: $icon-grey;
  height: 15px;
  margin-left: auto;
  width: 15px;
}

.preferred-language-select {
  width: 80%;
  margin: -0.6em auto 0 auto;
}

.error {
  color: $c-error-red;
}

.information-icon {
  margin-right: 0.5em;

  & path {
    fill: $c-information-blue;
  }
}
</style>
