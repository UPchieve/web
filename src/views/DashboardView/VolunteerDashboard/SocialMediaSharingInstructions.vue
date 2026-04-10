<script lang="ts" setup>
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import { useRoute } from 'vue-router'
import firstVolunteerHourSocialPost from '@/assets/first-volunteer-hour-social-post.png'
import threeStudentsTutoredSocialPost from '@/assets/three-students-tutored-social-post.png'
import { ref, computed } from 'vue'

const route = useRoute()

const socialMedia = route.query.socialMedia?.toString() || 'instagram'
const milestoneType = route.query.milestone?.toString() || 'hour'

const imageUrl = computed(() =>
  milestoneType === 'hour'
    ? firstVolunteerHourSocialPost
    : threeStudentsTutoredSocialPost
)

const downloadImage = async () => {
  const response = await fetch(imageUrl.value)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'UPchieve_Milestone.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const hourMilestoneCaption = `I completed my first hour volunteering as a tutor! Join me on
            UPchieve to make a real impact in education access, one student at a
            time.`

const studentMilestoneCaption = `I helped 3 students with their academic goals as a tutor! Join me on
            UPchieve to make a real impact in education access, one student at a
            time.`

const copyMessage = ref<string>('Copy caption')
async function copyCaption() {
  if (!navigator.clipboard) {
    return
  }
  try {
    const shareMessage =
      milestoneType === 'hour' ? hourMilestoneCaption : studentMilestoneCaption
    await navigator.clipboard.writeText(shareMessage)
    copyMessage.value = `Copied!`
    setTimeout(() => {
      copyMessage.value = 'Copy caption'
    }, 3000)
  } catch {
    copyMessage.value = 'Copy caption'
  }
}
</script>

<template>
  <FormPageTemplate layout="full card" hideLogo="true">
    <div class="main">
      <h1>
        {{
          socialMedia.toString().charAt(0).toUpperCase() + socialMedia.slice(1)
        }}
        Sharing Instructions
      </h1>

      <div class="img-container">
        <img
          :src="imageUrl"
          alt="Shareable UPchieve milestone image"
          class="share-image"
        />
        <button type="button" class="uc-form-button btn" @click="downloadImage">
          Download Image
        </button>
      </div>

      <div class="caption-container">
        <div class="caption">
          <p v-if="milestoneType === 'hour'">
            {{ hourMilestoneCaption }}
          </p>
          <p v-else>
            {{ studentMilestoneCaption }}
          </p>
        </div>
        <button type="button" class="uc-form-button btn" @click="copyCaption">
          {{ copyMessage }}
        </button>
      </div>
      <div v-if="socialMedia !== 'snapchat'">
        <h2>Don't forget to follow us @upchieve!</h2>
      </div>
    </div>
  </FormPageTemplate>
</template>

<style lang="scss" scoped>
.main {
  background-color: #fff;
  padding: 24px 42px;
  border-radius: 16px;
  text-align: center;
}

.btn {
  max-width: 200px;
  justify-self: center;
}

.img-container,
.caption-container {
  @include flex-container(column, center, center);
  margin: 24px;
}

.share-image {
  width: 100%;
  max-width: 300px;
}

.caption {
  max-width: 400px;
  background-color: rgba($upchieve-green, 0.1);
  padding: 16px;
  border-radius: 16px;
}
</style>
