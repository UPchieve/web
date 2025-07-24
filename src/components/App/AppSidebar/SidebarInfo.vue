<script lang="ts" setup>
import { ref, computed } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Case from 'case'
import { IonPopover, IonModal } from '@ionic/vue'

import { EVENTS } from '@/consts'
import Caret from '@/assets/right-caret.svg'
import QuestionIcon from '@/assets/question-mark-icon.svg'
import SwitchAccountModeButton from '@/components/SwitchAccountModeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import AuthService from '@/services/AuthService'

const $store = useStore()
const $router = useRouter()
const userMenuRef = ref()
const isUserMenuOpen = ref(false)

const user = computed(() => $store.state.user.user)
const firstName = computed(() => $store.getters['user/firstName'])
const isAuthenticated = computed(() => $store.getters['user/isAuthenticated'])
const isSessionAlive = computed(() => $store.getters['user/isSessionAlive'])
const userType = computed(() => $store.getters['user/userType'])
const avatar = computed(() => $store.getters['user/avatar'])
const isVolunteer = computed(() => $store.getters['user/isVolunteer'])
const isStudentVolunteer = computed(
  () => $store.getters['user/isStudentisStudentVolunteerolunteer']
)
const mobileMode = computed(() => $store.getters['app/mobileMode'])
const showAmbassadorTitle = computed(
  () => $store.getters['user/showAmbassadorTitle']
)
const isInAmbassadorProgram = computed(
  () => $store.getters['user/isVolunteerProgramAmbassador']
)

const ambassadorTooltipText = computed(() => {
  return isInAmbassadorProgram.value
    ? 'You are a member of our UPchieve Ambassadors program!'
    : `You've earned UPchieve ambassador status by referring ${user.value?.numReferredVolunteers ?? '5+'} friends. Nice work!`
})

const userAccountType = computed(() => {
  if (showAmbassadorTitle.value) {
    AnalyticsService.captureEvent(EVENTS.AMBASSADOR_SAW_AMBASSADOR_TITLE)
    return 'Volunteer Ambassador'
  }
  return Case.capital(userType.value ?? 'User') + ' Account'
})

const sessionStatus = computed(() => {
  const inSession = isSessionAlive.value

  const status = {
    text: 'Ready to chat',
    class: '',
  }

  if (isVolunteer.value) {
    status.text = 'Ready to help'
  }

  if (user.value?.banType === 'complete') {
    status.class += 'indicator--banned'
    status.text = 'Paused'
  }

  if (inSession) {
    status.class += 'indicator--session'
    status.text = 'Chat in session'
  }

  if (isVolunteer.value && !user.value?.isOnboarded) {
    status.class += 'indicator--onboarding'
    status.text = 'Onboarding'
  }

  if (isVolunteer.value && user.value?.isOnboarded && !user.value?.isApproved) {
    status.class += 'indicator--onboarding'
    status.text = 'Pending approval'
  }

  return status
})

onClickOutside(userMenuRef, (event) => {
  event.stopPropagation()
  if (isUserMenuOpen.value && !mobileMode.value) {
    isUserMenuOpen.value = false
  }
})

onKeyStroke('Escape', () => {
  if (isUserMenuOpen.value && !mobileMode.value) {
    isUserMenuOpen.value = false
  }
})

function openUserMenu() {
  isUserMenuOpen.value = true
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

function goTo(route: string) {
  closeUserMenu()
  $store.dispatch('app/sidebar/collapse')
  $router.push(route)
}

function logout() {
  closeUserMenu()
  AuthService.logout({ $router, $store })
}
</script>

<template>
  <div v-if="isAuthenticated">
    <div
      id="info-container"
      class="info-container"
      role="button"
      :aria-label="isUserMenuOpen ? 'Close user menu' : 'Open user menu'"
      :aria-expanded="isUserMenuOpen"
      aria-haspopup="menu"
      @click="openUserMenu"
      @keydown.enter="openUserMenu"
      @keydown.space.prevent="openUserMenu"
      tabindex="0"
    >
      <div
        v-if="avatar?.component"
        id="avatar-container"
        class="avatar-container"
      >
        <component :is="avatar?.component" class="avatar" aria-hidden="true" />
        <div class="indicator-container" aria-label="sessionStatus.text">
          <div class="indicator" :class="sessionStatus.class"></div>
        </div>
      </div>
      <div class="uc-column ml-2">
        <p class="first-name">{{ firstName }}</p>
        <div class="uc-row">
          <span class="account-type"
            >{{ userAccountType }}
            <span v-if="showAmbassadorTitle">
              <question-icon
                class="ambassador-title-tooltip-icon"
                id="ambassador-tooltip-icon"
                @click.stop
              />
              <ion-popover
                alignment="center"
                :showBackdrop="false"
                trigger="ambassador-tooltip-icon"
                trigger-action="click"
              >
                {{ ambassadorTooltipText }}
              </ion-popover>
            </span>
          </span>
        </div>
      </div>
      <caret class="caret" :class="{ 'caret--open': isUserMenuOpen }" />
      <div
        v-if="isUserMenuOpen && !mobileMode"
        class="user-menu"
        ref="userMenuRef"
        role="menu"
        aria-labelledby="info-container"
      >
        <div class="uc-row items-center pl-3 pt-2 pb-2">
          <div class="indicator mr-2" :class="sessionStatus.class"></div>
          <p class="minor-text">{{ sessionStatus.text }}</p>
        </div>
        <hr class="ml-2 mr-2" />
        <div
          class="menu-button pl-3 pt-2 pb-2"
          role="button"
          tabindex="0"
          @click.stop="goTo('/profile')"
          @keydown.stop.enter="goTo('/profile')"
        >
          Profile
        </div>
        <hr class="ml-2 mr-2" />
        <div
          class="menu-button pl-3 pt-2 pb-2"
          role="button"
          tabindex="0"
          @click="logout"
          @keydown.enter="logout"
        >
          Log out of UPchieve
        </div>
      </div>
    </div>

    <ion-modal
      v-if="mobileMode"
      :is-open="isUserMenuOpen"
      @did-dismiss="closeUserMenu"
      :initial-breakpoint="0.9"
      :breakpoints="[0, 0.9]"
      :backdrop-dismiss="true"
      :can-dismiss="true"
      presentation="sheet"
    >
      <div role="menu">
        <div class="uc-row pl-3 pt-4 pb-3">
          <component :is="avatar?.component" class="avatar" />
          <div class="uc-column pl-2">
            <p class="first-name">{{ firstName }}</p>
            <div class="uc-row items-center">
              <div class="indicator mr-1" :class="sessionStatus.class"></div>
              <p class="minor-text">{{ sessionStatus.text }}</p>
            </div>
          </div>
        </div>
        <hr class="ml-2 mr-2" />
        <div
          class="menu-button pl-3 pt-3 pb-3"
          role="button"
          tabindex="0"
          @click="goTo('/profile')"
          @keydown.enter="goTo('/profile')"
        >
          Profile
        </div>
        <hr class="ml-2 mr-2" />
        <div
          class="menu-button pl-3 pt-3 pb-3"
          role="button"
          tabindex="0"
          @click="logout"
          @keydown.enter="logout"
        >
          Log out of UPchieve
        </div>
      </div>
    </ion-modal>

    <hr class="ml-2 mr-2" />
    <SwitchAccountModeButton
      v-if="isStudentVolunteer"
      class="switch-account-mode-button"
    />
  </div>
</template>

<style lang="scss" scoped>
.info-container {
  @include flex-container(row, center, center);
  padding: 20px 15px;
  position: relative;

  &:hover {
    .avatar {
      height: 47px;
      width: 47px;
    }
  }
}

.avatar-container {
  @include flex-container(column, center, center);
  border: 2px solid #d8dee5;
  border-radius: 50%;
  height: 55px;
  position: relative;
  width: 55px;
  flex-shrink: 0;
}

.avatar {
  height: 45px;
  width: 45px;
}

.indicator-container {
  @include flex-container(column, center, center);
  background: white;
  border-radius: 50%;
  bottom: 0px;
  height: 15px;
  position: absolute;
  right: 1px;
  width: 15px;
}
.indicator {
  background: $c-success-green;
  border-radius: 50%;
  height: 10px;
  width: 10px;

  &--session,
  &--onboarding {
    background: $c-warning-orange;
  }

  &--banned {
    background-color: $c-banned-grey;
  }
}
.first-name {
  @include font-category(subheading);
  color: $c-soft-black;
  margin-top: 4px;
  margin-bottom: 0px;
}

.account-type {
  color: $c-secondary-grey;
  font-size: 14px;
  line-height: 1.15;
  margin-bottom: 0;
}

.caret {
  margin-left: auto;
  transform: rotate(90deg);
  transition: 200ms linear;

  &--open {
    transform: rotate(-90deg);
  }
}

.user-menu {
  background: white;
  border: 2px solid #f1f3f6;
  border-radius: 8px;
  box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);
  left: 4px;
  padding: 10px 0;
  position: absolute;
  top: 85%;
  width: 242px;
}

.minor-text {
  color: $c-default-grey;
  font-size: 12px;
  margin: 0;
}

.menu-button {
  color: $c-soft-black;

  &:hover {
    background: $c-background-grey;
    cursor: pointer;
  }
}

hr {
  margin: 0;
  border: 1px solid $c-background-grey;
}

.ambassador-title-tooltip-icon {
  height: 15px;
  width: 15px;
  margin-left: 4px;
  vertical-align: middle;
  display: inline-block;

  &:hover {
    cursor: pointer;
  }
}

.switch-account-mode-button {
  padding-left: 20px;
  padding-top: 15px;
}

ion-popover::part(content) {
  border-radius: 10px;
  padding: 8px;
  text-align: center;
}
</style>
