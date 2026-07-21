<script lang="ts" setup>
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import UserService from '@/services/UserService'
import { useRouter } from 'vue-router'
import { EVENTS } from '@/consts'
const router = useRouter()

const store = useStore()

function close() {
  store.dispatch('app/modal/hide')
}

const becomeAVolunteer = async () => {
  AnalyticsService.captureEvent(
    EVENTS.ROLE_SWITCHING_USER_CLICKED_BECOME_A_VOLUNTEER
  )
  try {
    await UserService.firstTransitionToVolunteerMode(router)
  } catch {
    // @TODO
  }
}
</script>

<template>
  <div class="more-info-modal">
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
          for the subjects you're interested in tutoring for. Then you can help
          other students on UPchieve!
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
      <LargeButton @click="close">No thanks</LargeButton>
      <LargeButton
        :show-arrow="false"
        variant="primary"
        @click="becomeAVolunteer"
        >Become a Volunteer Tutor!</LargeButton
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.more-info-modal {
  z-index: 10000;
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
</style>
