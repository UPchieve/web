<script lang="ts" setup>
import ReferralLink from '@/components/ReferralLink.vue'
import AmbassadorIcon from '@/assets/user_avatars/ambassador-icon.svg'
import CrossIcon from '@/assets/cross.svg'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import { onMounted } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { ref, computed } from 'vue'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import FormInput from '@/components/FormInput.vue'
import config from '@/config'
import NetworkService from '@/services/NetworkService'

const store = useStore()
const closeModal = () => {
  store.dispatch('app/modal/hide')
}

const emit = defineEmits<{
  (e: 'copied'): void
  (e: 'sent'): void
}>()

const isTextReferralLinksEnabled = computed(
  () => store.getters['featureFlags/isTextReferralLinksEnabled']
)
const user = computed(() => store.state.user.user)
const copyText = ref('Copy Link')
const sendText = ref('Send Text')
const phoneNumber = ref('')
const errorMessage = ref('')

function referralLink() {
  const { referralCode } = user.value
  if (import.meta.env.NODE_ENV === 'development') {
    return `http://localhost:8080/referral/${referralCode}`
  } else {
    return `${config.serverRoot}/referral/${referralCode}`
  }
}

const onCopiedReferralLink = () => {
  if (isTextReferralLinksEnabled.value) {
    AnalyticsService.captureEvent(EVENTS.STUDY_USER_CLICKED_SEND_REFERRAL_TEXT)
  } else {
    AnalyticsService.captureEvent(EVENTS.AMBASSADOR_REFERRAL_CLICKED_COPY)
  }
  copyLink()
}

async function copyLink() {
  if (!navigator.clipboard) {
    return
  }
  try {
    await navigator.clipboard.writeText(referralLink())
    copyText.value = 'Copied'
    emit('copied')
    setTimeout(() => {
      copyText.value = 'Copy Link'
    }, 3000)
  } catch (error) {
    copyText.value = 'Copy Link'
  }
}

async function sendTextMessage(phoneNumber: string) {
  try {
    await NetworkService.sendReferralText(phoneNumber)
    AnalyticsService.captureEvent(EVENTS.STUDY_USER_CLICKED_SEND_REFERRAL_TEXT)
    sendText.value = 'Text sent!'
    emit('sent')
    setTimeout(() => {
      sendText.value = 'Send Text'
    }, 3000)
  } catch {
    sendText.value = 'Send Text'
    errorMessage.value = `Sorry! We couldn't send your text. Please try again later.`
  }
}
onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.AMBASSADOR_REFERRAL_SAW_MODAL)
})
</script>

<template>
  <div class="referral-modal">
    <button class="x-button" @click="closeModal">
      <CrossIcon class="x-icon" />
    </button>
    <ambassador-icon class="icon" />
    <h1 class="referral-modal-title">Become an UPchieve Ambassador!</h1>
    <div class="referral-links-enabled-div" v-if="isTextReferralLinksEnabled">
      <p>
        Did you know you can earn volunteer hours by recruiting new tutors for
        UPchieve? Just send a text below or share your
        <strong>unique signup link</strong> with your friends, family, and
        colleagues.
      </p>

      <div class="text-or-link-container">
        <p class="send-text"><strong>Send Text</strong></p>
        <div class="phone-number-input-container">
          <maz-phone-number-input
            id="phoneNumber"
            class="phone-number-input"
            v-model="phoneNumber"
          />
          <button class="send-btns" @click="sendTextMessage(phoneNumber)">
            {{ sendText }}
          </button>
        </div>
        <div class="referral-link-input-div">
          <p class="send-text"><strong>Copy Link</strong></p>
          <div class="referral-link-input-container">
            <FormInput
              type="text"
              class="referral-link-input"
              :readOnly="true"
              :modelValue="referralLink()"
            />
            <button class="send-btns" @click="onCopiedReferralLink">
              {{ copyText }}
            </button>
          </div>
        </div>
      </div>
      <p class="errors">{{ errorMessage }}</p>
    </div>
    <div v-else>
      Did you know you can earn volunteer hours by recruiting new tutors for
      UPchieve? Just share your <strong>unique signup link</strong> with your
      friends, family, and colleagues:

      <ReferralLink @copied="onCopiedReferralLink" />

      Get 5 signups to earn 1 volunteer hour and become an official UPchieve
      Ambassador-- <strong>great for resumés and college apps!</strong> 🎉
    </div>
    <LargeButton
      variant="primary"
      :showArrow="false"
      class="close-modal-button"
      @click="closeModal"
      >Got it!</LargeButton
    >
  </div>
</template>

<style lang="scss">
.uc-form-text-input {
  border-radius: 12px !important;
  width: 100%;
}

.uc-form-element {
  margin-top: 0 !important;
}
</style>
<style lang="scss" scoped>
.referral-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.x-button {
  margin-left: auto;

  .x-icon {
    height: 20px;
    width: 20px;
  }
}

.referral-modal-title {
  @include font-category('heading');
  padding-top: 16px;
}

.icon {
  height: fit-content;
  width: 40%;
}

.close-modal-button {
  margin-left: auto;
  width: 100%;
  margin-top: 8px;
}

.send-text {
  margin-bottom: 4px;
}

.referral-link-input-div {
  @include flex-container(column, flex-start, flex-start);
  margin-top: 16px;
  width: 100%;
}

.referral-links-enabled-div {
  @include flex-container(column, center, center);
}

.text-or-link-container {
  @include flex-container(column, flex-start, flex-start);
  width: 100%;
  padding: 24px;
}

.referral-link-input-container {
  @include flex-container(row, center, center);
  gap: 16px;
  width: 100%;
}

.referral-link-input {
  width: 100%;
}

.phone-number-form {
  @include flex-container(column, flex-start, flex-start);
  width: 100%;
}

.phone-number-input-container {
  @include flex-container(row, center, center);
  gap: 16px;
}

.phone-number-input {
  width: 100%;
}

.send-btns {
  background-color: $c-information-blue;
  color: #fff;
  border-radius: 12px;
  padding: 12px;
  white-space: nowrap;
}
</style>
