<script lang="ts" setup>
import CrossIcon from '@/assets/cross.svg'
import { useStore } from 'vuex'
import { onMounted } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { ref, computed } from 'vue'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import FormInput from '@/components/FormInput.vue'
import config from '@/config'
import NetworkService from '@/services/NetworkService'
import EmailIcon from '@/assets/social_sharing_icons/email_icon.svg'
import FacebookIcon from '@/assets/social_sharing_icons/facebook_icon.svg'
import LinkedinIcon from '@/assets/social_sharing_icons/linkedin_icon.svg'
import TextIcon from '@/assets/social_sharing_icons/text_icon.svg'
import Modal from '@/components/Modal.vue'
import QRCodeStyling, { type DotType } from 'qr-code-styling'

const store = useStore()

const emit = defineEmits<{
  (e: 'copied'): void
  (e: 'sent'): void
}>()

defineProps({
  closeModal: { type: Function, required: true },
})

const isTextReferralLinksEnabled = computed(
  () => store.getters['featureFlags/isTextReferralLinksEnabled']
)

const isReferralModalRedesignEnabled = computed(
  () => store.getters['featureFlags/isReferralModalRedesignEnabled']
)
const user = computed(() => store.state.user.user)
const firstName = computed(() => store.getters['user/firstName'])
const copyText = ref('Copy')
const sendText = ref('Send Text')
const phoneNumber = ref('')
const errorMessage = ref('')
const isMobile = computed(() => store.getters['app/mobileMode'])
const qrElement = ref<HTMLDivElement | null>(null)

const options = {
  width: 200,
  height: 200,
  data: referralLink({ isQrCode: true }),
  dotsOptions: {
    color: '#000',
    type: 'rounded' as DotType,
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  imageOptions: {
    margin: 10,
  },
}

const qrCode = new QRCodeStyling(options)

onMounted(() => {
  if (qrElement.value) {
    qrCode.append(qrElement.value)
  }
})

function referralLink({ isQrCode = false } = {}) {
  const { referralCode } = user.value

  const isDev = import.meta.env.NODE_ENV === 'development'
  const base = isDev
    ? `http://localhost:8080/referral/${referralCode}`
    : `${config.serverRoot}/referral/${referralCode}`

  if (isQrCode && !isDev) {
    return `${base}?utm_source=referral_code&utm_medium=qr_code&utm_campaign=ambassadors`
  }

  return base
}

const onCopiedReferralLink = () => {
  if (isTextReferralLinksEnabled.value) {
    AnalyticsService.captureEvent(EVENTS.STUDY_USER_CLICKED_COPY_REFERRAL_LINK)
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
      copyText.value = 'Copy'
    }, 3000)
  } catch {
    copyText.value = 'Copy'
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

function isMac() {
  return /Mac|Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent)
}

const textShareMessage = `I've been volunteering with UPchieve, a nonprofit that offers free online tutoring to students who need it most. It's easy to get started, flexible, low-commitment, and really meaningful. You should check it out: `

const emailShareMessage = `Hi,

I've been volunteering with UPchieve, a nonprofit that provides free online tutoring to students who need it most. It's super easy to get started, flexible, and low-commitment, and honestly really meaningful too.

I think you'd be great at it, and I'd love for you to check it out:
${referralLink()}

${firstName.value}`

const linkedinShareMessage = `I volunteer with UPchieve, a nonprofit that provides free, online tutoring to students from low-income communities.

What I love about it is that it's completely virtual, flexible, and low-commitment—yet every session makes a real difference for a student who might not otherwise get academic support.

If you're looking for a meaningful way to give back on your own schedule, I highly recommend checking it out:`

function shareVia(method: 'text' | 'email' | 'linkedin' | 'facebook') {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const smsBodyParam = isIOS ? '&body=' : '?body='

  switch (method) {
    case 'text':
      AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLICKED_TEXT)
      window.location.href = `sms:${smsBodyParam}${encodeURIComponent(`${textShareMessage} ${referralLink()}`)}`
      break

    case 'email':
      AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLICKED_EMAIL)
      window.location.href = `mailto:?subject=${encodeURIComponent(`I've been volunteering with UPchieve`)}&body=${encodeURIComponent(emailShareMessage)}`
      break

    case 'linkedin':
      AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLICKED_LINKEDIN)
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink())}&text=${encodeURIComponent(linkedinShareMessage)}`,
        '_blank'
      )
      break

    case 'facebook':
      AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLICKED_FACEBOOK)
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink())}`,
        '_blank'
      )
      break

    default:
      copyLink()
  }
}

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.AMBASSADOR_REFERRAL_SAW_MODAL)
})
</script>

<template>
  <Modal :closeModal="() => closeModal()" class="modal">
    <div class="referral-modal">
      <div class="referral-modal__left">
        <div class="close-button-left">
          <CrossIcon class="x-icon" @click="closeModal" />
        </div>
        <h1 class="referral-modal__title">
          Invite Coaches, Help More Students
        </h1>
        <p>
          Every Coach you invite helps up to
          <strong>20 more students</strong> get the support they need.
        </p>
        <p>
          Plus, earn 1 volunteer hour for every 5 signups and become an official
          <strong>UPchieve Ambassador</strong>, great for resumés and college
          apps! 🎉
        </p>

        <div class="referral-link-input-div">
          <p class="send-text"><strong>Copy Link</strong></p>
          <div class="referral-link-input-container">
            <FormInput
              type="text"
              class="referral-link-input"
              :readOnly="true"
              :modelValue="referralLink()"
            />
            <button
              type="button"
              class="send-btns"
              @click="onCopiedReferralLink"
            >
              {{ copyText }}
            </button>
          </div>
        </div>
        <div v-if="isTextReferralLinksEnabled" class="referral-link-input-div">
          <p class="send-text"><strong>Send Text</strong></p>
          <div class="phone-number-input-container">
            <maz-phone-number-input
              id="phoneNumber"
              class="phone-number-input"
              v-model="phoneNumber"
            />
            <button
              type="button"
              class="send-btns"
              @click="sendTextMessage(phoneNumber)"
            >
              {{ sendText }}
            </button>
          </div>
        </div>
        <div
          class="referral-link-input-div"
          v-if="isReferralModalRedesignEnabled"
        >
          <p class="send-text"><strong>Share via</strong></p>
          <div class="share-via-input-container">
            <button
              type="button"
              v-if="isMac() || isMobile"
              @click="shareVia('text')"
            >
              <text-icon />
            </button>
            <button type="button" @click="shareVia('email')">
              <email-icon />
            </button>
            <button type="button" @click="shareVia('linkedin')">
              <linkedin-icon />
            </button>
            <button type="button" @click="shareVia('facebook')">
              <facebook-icon />
            </button>
          </div>
        </div>
      </div>
      <div class="referral-modal__right">
        <div class="close-button-right">
          <CrossIcon class="x-icon" @click="closeModal" />
        </div>
        <div class="qr-container">
          <div ref="qrElement" class="qr-canvas"></div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
::v-deep(.upc-modal-form) {
  max-width: none;
  padding: 0;
  width: auto;
}

::v-deep(.upc-modal-form--bottom-padding) {
  padding: 0;
}

.referral-modal {
  @include flex-container(row, center, stretch);
  width: 100%;
  height: 100%;
  min-height: 450px;
  gap: 8px;
  text-align: left;

  @include breakpoint-below('medium') {
    @include flex-container(column, flex-start, center);
  }

  &__title {
    font-size: 24px;
    text-align: left;
  }

  &__left {
    max-width: 500px;
    padding: 16px;

    @include breakpoint-below('medium') {
      max-width: 100%;
    }

    .close-button-left {
      text-align: right;

      @include breakpoint-above('medium') {
        display: none;
      }
    }
  }

  &__right {
    @include flex-container(column, center, center);
    background-color: $c-success-green;
    background-image: url('@/assets/referral_qr_code_background.avif');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    min-width: 490px;
    height: auto;
    padding: 16px;
    position: relative;

    @include breakpoint-below('large') {
      min-width: 400px;
    }

    @include breakpoint-below('medium') {
      min-height: 50%;
      min-width: 100%;
    }

    .close-button-right {
      position: absolute;
      top: 16px;
      right: 16px;
      display: block;

      @include breakpoint-below('medium') {
        display: none;
      }
    }

    .qr-container {
      @include flex-container(column, center, center);
      height: 100%;
    }
  }
}

.x-icon {
  height: 16px;
  width: 16px;
  cursor: pointer;
}

.send-text {
  margin-bottom: 4px;
}

.referral-link-input-div {
  @include flex-container(column, flex-start, flex-start);
  margin-top: 16px;
  width: 100%;
}

.referral-link-input-container {
  @include flex-container(row, center, center);
  gap: 16px;
  width: 100%;
}

.referral-link-input {
  width: 100%;
  margin-top: 0;
}

.phone-number-input-container {
  @include flex-container(row, center, center);
  gap: 16px;
  width: 100%;
  :deep(.m-input-wrapper) {
    width: 100%;
  }
}

.phone-number-input {
  width: 100%;
}

.send-btns {
  background-color: $c-information-blue;
  color: #fff;
  border-radius: 32px;
  padding: 12px 20px;
  white-space: nowrap;
}

.share-via-input-container {
  @include flex-container(row, center, flex-start);
  gap: 24px;
  margin: 8px 0;
}
</style>
