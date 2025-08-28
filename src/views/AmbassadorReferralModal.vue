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

const store = useStore()
const closeModal = () => {
  AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLOSE)
  store.dispatch('app/modal/hide')
}

const emit = defineEmits<{
  (e: 'copied'): void
  (e: 'sent'): void
}>()

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
  } catch (error) {
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
  <div class="referral-modal">
    <div class="referral-modal__left">
      <div class="close-button-container">
        <button class="x-button" @click="closeModal">
          <CrossIcon class="x-icon" />
        </button>
      </div>
      <h1 class="referral-modal__title">Invite Coaches, Help More Students</h1>
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
          <button class="send-btns" @click="onCopiedReferralLink">
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
          <button class="send-btns" @click="sendTextMessage(phoneNumber)">
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
          <button v-if="isMac() || isMobile" @click="shareVia('text')">
            <text-icon />
          </button>
          <button @click="shareVia('email')"><email-icon /></button>
          <button @click="shareVia('linkedin')"><linkedin-icon /></button>
          <button @click="shareVia('facebook')"><facebook-icon /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.referral-modal {
  @include flex-container(row, flex-start, flex-start);
  gap: 8px;
  text-align: left;

  &__title {
    font-size: 24px;
    text-align: left;
  }
}

.close-button-container {
  text-align: right;
}
.x-button {
  margin-left: auto;
  .x-icon {
    height: 16px;
    width: 16px;
  }
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
