<template>
  <div class="header">
    <div
      class="header-message uc-row ml-auto"
      :class="{ 'mobile-header-message': mobileMode }"
    >
      <div class="emoji">🌟</div>
      {{ studentsBecomeVolunteersCopy }}
      <div class="emoji">📚</div>
    </div>
    <LargeButton @click="toggleShowInfoModal" class="ml-auto">
      Become a tutor!
    </LargeButton>
    <Modal v-if="showModal" class="more-info-modal">
      <h3 class="heading">How it works</h3>
      <span class="main-message">
        <ul>
          <li>
            <span class="emoji">🙌</span>
            &nbsp;Your account will have access to <strong>both</strong> Student
            Mode and Volunteer Mode.
          </li>
          <li>
            <span class="emoji">🎓</span>
            &nbsp;In <strong>Student Mode</strong>, you can request help from
            tutors whenever you need it, just like you can now.
          </li>
          <li>
            <span class="emoji">🍎</span>
            &nbsp;In <strong>Volunteer Mode</strong>, you will receive training
            for the subjects you're interested in tutoring for. Then you can
            help other students on UPchieve!
          </li>
          <li>
            <span class="emoji">🔄</span>
            &nbsp;<strong
              >You can switch between Student Mode and Volunteer Mode at any
              time!</strong
            >
          </li>
        </ul>
      </span>
      <div class="buttons">
        <LargeButton @click="toggleShowInfoModal">No thanks</LargeButton>
        <LargeButton
          :show-arrow="false"
          variant="primary"
          @click="becomeAVolunteer"
          >Become a Volunteer Tutor!</LargeButton
        >
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import { useRouter } from 'vue-router'
import NetworkService from '@/services/NetworkService'
import { useStore } from 'vuex'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import UserService from '@/services/UserService'

const router = useRouter()
const store = useStore()
const showModal = ref<boolean>(false)
const toggleShowInfoModal = () => {
  showModal.value = !showModal.value
  if (showModal.value)
    AnalyticsService.captureEvent(EVENTS.ROLE_SWITCHING_USER_CLICKED_BANNER)
}

const becomeAVolunteer = async () => {
  AnalyticsService.captureEvent(
    EVENTS.ROLE_SWITCHING_USER_CLICKED_BECOME_A_VOLUNTEER
  )
  try {
    await NetworkService.addVolunteerRoleForStudent()
    await UserService.switchActiveRole({ $store: store }, 'volunteer')
    if (router.currentRoute.value.path === '/dashboard') router.go(0)
    else await router.replace('/dashboard')
  } catch (err) {
    // @TODO
  }
}
const studentsBecomeVolunteersCopy = computed(
  () => store.getters['featureFlags/studentsBecomeVolunteersCopy']
)
const mobileMode = computed(() => store.getters['app/mobileMode'])
onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.ROLE_SWITCHING_USER_SAW_BANNER)
})
</script>

<style lang="scss" scoped>
.header {
  @include header-child;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: $c-information-blue;

  .header-message {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: $upchieve-white;
    font-weight: 500;
  }

  .mobile-header-message {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: $upchieve-white;
    font-weight: 500;
    font-size: 14px;
  }

  .main-message {
    ul {
      text-align: left;
    }

    li {
      margin-bottom: 1rem;
      list-style-type: none;
    }
  }

  .emoji {
    font-size: 22px;
  }

  .buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    width: 100%;
    margin: 0 auto;
    gap: 16px;
    padding-top: 16px;
  }
}
</style>
