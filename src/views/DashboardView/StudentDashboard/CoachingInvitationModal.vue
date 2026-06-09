<script lang="ts" setup>
import CrossIcon from '@/assets/cross.svg'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import { useStore } from 'vuex'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Spinner from '@/components/Spinner.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const emit = defineEmits(['closed'])
const store = useStore()
const router = useRouter()
const isLoading = ref<boolean>(false)

function closeModal() {
  AnalyticsService.captureEvent(EVENTS.NOMINATED_STUDENT_DISMISSED_MODAL)
  emit('closed')
}

onMounted(() => {
  AnalyticsService.captureEvent(
    EVENTS.NOMINATED_STUDENT_SAW_COACHING_INFO_MODAL
  )
})
async function switchToVolunteerMode() {
  AnalyticsService.captureEvent(
    EVENTS.NOMINATED_STUDENT_CLICKED_I_WANT_TO_VOLUNTEER
  )
  try {
    isLoading.value = true
    if (!store.getters['user/hasVolunteerRole']) {
      await NetworkService.addVolunteerRoleForStudent()
      await router.replace('/switch-mode?isNewMode=true')
    }
  } catch (err) {
    LoggerService.noticeError(
      err,
      'Failled to add volunteer role and switch modes - student coach invitation'
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Modal>
    <div class="exit-button" @click="closeModal">
      <CrossIcon class="exit-icon" />
    </div>
    <h2>WHAT IT LOOKS LIKE FROM THE OTHER SIDE</h2>
    <h1>You already know this place. Here's the flip.</h1>
    <p>
      Students like you are requesting help right now. And you already know what
      it feels like to be that student.
    </p>

    <div class="step-grid">
      <span class="step-number">1</span>
      <span class="step-description"
        ><strong>A student requests help — you get matched.</strong> Same
        whiteboard, same chat. Just you on the other side this time.</span
      >
    </div>
    <hr />
    <div class="step-grid">
      <span class="step-number">2</span>
      <span class="step-description"
        ><strong>No lesson plan. No script. No performance.</strong> You're not
        there to have all the answers — you're there to think alongside
        them.</span
      >
    </div>
    <hr />
    <div class="step-grid">
      <span class="step-number">3</span>
      <span class="step-description"
        ><strong>You set your own schedule — no minimum hours.</strong> Coach
        once a week or once a month. Pause whenever life gets busy.</span
      >
    </div>

    <div class="buttons-container">
      <Spinner v-if="isLoading" />
      <LargeButton
        v-else
        @click="switchToVolunteerMode"
        variant="primary-blue"
        :showArrow="false"
        >I want to coach</LargeButton
      >
      <button @click="closeModal" class="tertiary-button" type="button">
        Not for me
      </button>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.exit-button {
  margin-left: auto;
  padding: 8px 5px 16px 5px;

  &:hover {
    cursor: pointer;
  }
}
.exit-icon {
  height: 15px;
  width: 15px;
}

h1 {
  @include font-category('display-small');
}

h2 {
  @include font-category('subheading');
  color: $c-secondary-grey;
  font-weight: 600;
  margin-top: 0;
}

p {
  @include font-category('body');
  color: $c-secondary-grey;
}

.step-grid {
  display: grid;
  grid-template-columns: 1fr 15fr;
  grid-template-rows: 1fr;
  grid-column-gap: 8px;

  @include breakpoint-below('medium') {
    padding: 16px;
  }
}

.step-number {
  color: $c-success-green;
  font-weight: 700;
  grid-column: 1;
}

.step-description {
  grid-column: 2;
}

hr {
  color: $c-border-grey;
  height: 1px;
}

.tertiary-button {
  text-decoration: underline;
  color: $c-secondary-grey;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
  align-items: center;
}
</style>
