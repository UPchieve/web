<template>
  <modal
    :closeModal="handleCloseModal"
    class="volunteer-welcome-modal-wrapper"
    backText="Dashboard"
  >
    <img
      class="volunteer-welcome-modal-header-img"
      src="@/assets/updog-certificate-cheer.png"
      alt="image welcoming new volunteers"
    />
    <div class="volunteer-welcome-modal">
      <div class="volunteer-welcome-modal-title-container">
        <h1 class="volunteer-welcome-modal-title">🎉 Nice work, coach!</h1>
        <p>You've just made a big impact — and that's worth celebrating.</p>
        <p>
          {{ message }}
        </p>
        <div class="share-buttons">
          <FormSelect
            name="sharing-options"
            :options="sharingOptions"
            v-model="selectedOption"
            placeholder="Share via:"
            optionTextField="text"
            :reduce="(option: any) => option.value"
          />
          <button class="uc-form-button" @click="shareVia">Share!</button>
        </div>
      </div>
    </div>
  </modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import Modal from '@/components/Modal.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import config from '@/config'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const props = defineProps<{
  closeModal: () => void
  typeOfMilestone: 'hour' | 'students' | string
}>()

const store = useStore()

const user = computed(() => store.state.user.user)

const sharingOptions = [
  {
    text: 'Text / SMS',
    value: 'text',
  },
  {
    text: 'WhatsApp',
    value: 'whatsapp',
  },
  {
    text: 'Email',
    value: 'email',
  },
  {
    text: 'LinkedIn',
    value: 'linkedin',
  },
  {
    text: 'Instagram',
    value: 'instagram',
  },
  {
    text: 'TikTok',
    value: 'tiktok',
  },
  {
    text: 'Snapchat',
    value: 'snapchat',
  },
]
const selectedOption = ref<string>('')

const referralLink = computed(() => {
  const referralCode = user.value?.referralCode
  if (!referralCode) return ''
  return import.meta.env.NODE_ENV === 'development'
    ? `http://localhost:8080/referral/${referralCode}`
    : `${config.serverRoot}/referral/${referralCode}`
})

const message = () => {
  if (props.typeOfMilestone === 'hour') {
    AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_ONE_HOUR_MODAL)
    return `You just spent an hour changing lives. Your time makes a difference
            — why not inspire someone else to do the same? Share your impact
            with your network.`
  } else if (props.typeOfMilestone === 'students') {
    AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_THREE_STUDENTS_MODAL)
    return `Three students, one amazing tutor. You've helped multiple students
            take a step closer to their goals. Let your friends know — and maybe
            inspire them to join too!`
  } else
    return `You've made a huge difference on UPchieve helping students reach their academic goals! Let your friends know - and maybe inspire them to join too!`
}

const shareMessage = computed(() => {
  if (props.typeOfMilestone === 'hour') {
    return `I just volunteered an hour with UPchieve to tutor students who need support. You can make a difference too! Sign up to tutor with UPchieve here: ${referralLink.value}`
  } else if (props.typeOfMilestone === 'students') {
    return `I just helped 3 students reach their academic goals with UPchieve. You can be a part of it too! Sign up to tutor with UPchieve here: ${referralLink.value}`
  }
  return `I'm volunteering on UPchieve and helping students reach their academic goals! You can be a part of it too! Sign up to tutor with UPchieve here: ${referralLink.value}`
})

function handleCloseModal() {
  props.closeModal()
}

function shareToSocials(socialMedia: string) {
  const basePath =
    import.meta.env.NODE_ENV === 'development'
      ? 'http://localhost:8080/social-media-sharing-instructions'
      : `${config.serverRoot}/social-media-sharing-instructions`

  const url = `${basePath}/?socialMedia=${socialMedia}&milestone=${encodeURIComponent(props.typeOfMilestone)}`
  window.open(url)
}

async function shareVia() {
  const shareVia = selectedOption.value
  const message = shareMessage.value

  switch (shareVia) {
    case 'text': {
      AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_TEXT)

      if (navigator.share) {
        await navigator.share({
          title: message,
        })
      } else {
        alert('Sharing is not supported on this device.')
      }
      handleCloseModal()
      break
    }
    case 'email': {
      AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_EMAIL)
      const subject = `I'm volunteering with UPchieve!`
      const body = `${message}\n\nLearn more: ${referralLink.value}`
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      handleCloseModal()
      break
    }
    case 'whatsapp': {
      AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_WHATSAPP)
      const text = message.trim()
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
      window.open(url, '_blank')
      handleCloseModal()
      break
    }
    case 'linkedin': {
      AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_LINKEDIN)
      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${referralLink.value}`
      window.open(url, '_blank')
      handleCloseModal()
      break
    }
    case 'instagram': {
      AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_INSTAGRAM)
      shareToSocials('instagram')
      handleCloseModal()
      break
    }
    case 'tiktok': {
      AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_TIKTOK)
      shareToSocials('tiktok')
      handleCloseModal()
      break
    }
    case 'snapchat': {
      AnalyticsService.captureEvent(EVENTS.STUDY_SHARING_SNAPCHAT)
      shareToSocials('snapchat')
      handleCloseModal()
      break
    }
    default: {
      handleCloseModal()
      break
    }
  }
}
</script>

<style lang="scss" scoped>
.share-buttons {
  @include flex-container(column, center, center);
}
</style>
