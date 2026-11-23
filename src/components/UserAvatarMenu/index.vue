<script lang="ts" setup>
import { useStore } from 'vuex'
import { useAppSidebarStore } from '@/stores/app/sidebar'
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Menu from '@/components/Menu.vue'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'
import UserService from '@/services/UserService'
import LoggerService from '@/services/LoggerService'
import UserAvatar from '@/components/UserAvatarMenu/UserAvatar.vue'
import UserModeToggle from '@/components/UserAvatarMenu/UserModeToggle.vue'
import { useSessionOfferStore } from '@/stores/session-offer'
import { IonToast } from '@ionic/vue'

const props = withDefaults(
  defineProps<{
    showAccountModeLabel: boolean
    showSessionStatusLabel: boolean
    isMenuOpen: boolean
  }>(),
  {
    showAccountModeLabel: true,
    showSessionStatusLabel: true,
    isMenuOpen: false,
  }
)

const store = useStore()
const sidebarStore = useAppSidebarStore()
const router = useRouter()

const sessionStatus = computed(() => store.getters['user/sessionStatus'])
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const isStudentVolunteer = computed(
  () => store.getters['user/isStudentVolunteer']
)
const isStudentCoachModeBlocked = computed(
  () => store.getters['featureFlags/isStudentCoachModeBlocked']
)
const isS2VThemingEnabled = store.getters['featureFlags/isS2VThemingEnabled']

// Menu
function closeMenu() {
  isMenuOpen.value = false
  // The router collapses the mobile drawer only when the route name changes, so it misses
  // tapping Profile while already on Profile, and switching modes on the dashboard, which
  // does not navigate at all.
  sidebarStore.collapse()
}

function goTo(path: string) {
  closeMenu()
  router.push(path)
}

function logout() {
  closeMenu()
  AuthService.logout({ router, store })
}

const emit = defineEmits<{
  (e: 'update:isMenuOpen', value: boolean): void
  (e: 'switchModeError', message: string): void
}>()
const isMenuOpen = computed({
  get: () => props.isMenuOpen,
  set: (value) => {
    emit('update:isMenuOpen', value)
    if (!value && errorMessage.value.length) {
      errorMessage.value = ''
    }
  },
})

const animateAvatar = ref<boolean>(false)
function onSwitchedMode() {
  closeMenu()
  animateAvatar.value = true
  store.commit('app/setFadeInContent', true) // start animation
}

function onSwitchModeError(message: string) {
  isConfirmingLeaveQueue.value = false
  errorMessage.value = message
  isMenuOpen.value = true
}

const { isInQueue } = storeToRefs(useSessionOfferStore())
const userType = computed(() => store.getters['user/userType'])
const isConfirmingLeaveQueue = ref(false)
const stayButton = ref<HTMLButtonElement>()

watch(
  () => props.isMenuOpen,
  (isOpen) => {
    if (!isOpen) return
    isConfirmingLeaveQueue.value = false
  }
)

async function onSwitchModeClick() {
  if (userType.value === 'volunteer' && isInQueue.value) {
    isConfirmingLeaveQueue.value = true
    await nextTick()
    stayButton.value?.focus()
    return
  }
  await switchMode()
}

function stayInQueue() {
  isConfirmingLeaveQueue.value = false
}

async function switchMode() {
  const targetMode = userType.value === 'student' ? 'volunteer' : 'student'
  const isOnDashboard = router.currentRoute.value.path === '/dashboard'
  try {
    await UserService.switchActiveRole({ $store: store }, targetMode)
    if (!isOnDashboard) {
      await router.push('/dashboard')
    }
    onSwitchedMode()
  } catch (err) {
    LoggerService.noticeError(
      'Failed to switch account modes via UserModeToggle',
      err
    )
    onSwitchModeError(
      `Couldn't switch to ${targetMode} mode. Try refreshing the page.`
    )
  }
}
const errorMessage = ref<string>('')
function resetErrorMessage() {
  errorMessage.value = ''
}
</script>

<template>
  <div
    class="main-container"
    :class="{
      'main-container--mobile': isMobileMode,
    }"
  >
    <UserAvatar
      class="user-avatar"
      @animationend="() => (animateAvatar = false)"
      :showSessionStatusLabel="false"
      :animate="animateAvatar"
    />
    <Menu
      v-model:isOpen="isMenuOpen"
      class="user-menu"
      location="bottom center"
      caretThickness="bold"
      :buttonHeightPx="12"
      transition="slide-y-transition"
      :useS2vTheming="isS2VThemingEnabled"
    >
      <template v-slot:content>
        <div
          v-if="isConfirmingLeaveQueue"
          :class="[
            'leave-queue-confirmation',
            { 'leave-queue-confirmation--mobile': isMobileMode },
          ]"
          role="alertdialog"
          aria-labelledby="leave-queue-confirmation-message"
          data-testid="leave-queue-confirmation"
        >
          <p id="leave-queue-confirmation-message">
            Leave queue and switch to Student Mode.
          </p>
          <div class="leave-queue-confirmation__buttons">
            <button
              ref="stayButton"
              type="button"
              class="confirmation-btn confirmation-btn--secondary"
              @click="stayInQueue"
              data-testid="leave-queue-stay"
            >
              Stay
            </button>
            <button
              type="button"
              class="confirmation-btn confirmation-btn--primary"
              @click="switchMode"
              data-testid="leave-queue-confirm"
            >
              Switch
            </button>
          </div>
        </div>
        <div
          v-else
          :class="[
            'menu-content-container',
            { 'menu-content-container--mobile': isMobileMode },
          ]"
        >
          <!--          On mobile, also show the avatar in the drawer/modal since the drawer will cover the other one-->
          <!--          Skip this for student-volunteers because we need the space to show the mode toggle.-->
          <UserAvatar
            class="user-avatar"
            v-if="isMobileMode && !isStudentVolunteer"
            :showAccountModeLabel="false"
            :showIndicatorRing="false"
          />
          <UserModeToggle
            id="mode-toggle"
            class="user-menu-toggle"
            v-if="!isStudentCoachModeBlocked && isStudentVolunteer"
            @switchMode="onSwitchModeClick"
          />
          <!--          On desktop, show error in a toast-->
          <IonToast
            v-if="!isMobileMode"
            :isOpen="errorMessage.length"
            :message="errorMessage"
            :duration="1000 * 5"
            position="bottom"
            positionAnchor="mode-toggle"
            @didDismiss="resetErrorMessage"
            class="anchored-error-toast"
          />

          <div
            v-if="!isMobileMode"
            class="session-status-container"
            data-testid="session-status-container"
          >
            <div
              :class="[
                'indicator',
                sessionStatus.class,
                { 'indicator--mobile': isMobileMode },
              ]"
            />
            <span>
              {{ sessionStatus.text }}
            </span>
          </div>
          <div class="error" v-if="isMobileMode && errorMessage.length">
            {{ errorMessage }}
          </div>
          <hr />
          <table>
            <tr>
              <td>
                <div
                  role="button"
                  tabindex="0"
                  @click.stop="goTo('/profile')"
                  @keydown.stop.enter="goTo('/profile')"
                  data-testid="menu-row-profile"
                >
                  Profile
                </div>
              </td>
            </tr>
            <hr />
            <tr>
              <td>
                <div
                  role="button"
                  tabindex="0"
                  @click.stop="logout"
                  @keydown.stop.enter="logout"
                  data-testid="menu-row-logout"
                >
                  Log out of UPchieve
                </div>
              </td>
            </tr>
          </table>
        </div>
      </template>
    </Menu>
  </div>
</template>

<style lang="scss" scoped>
.user-menu {
  grid-row: 1;
  grid-column: menu-button;
}

.menu-content-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 3px;
  gap: 4px;

  &--mobile {
    padding: 8px;
    gap: 8px;
  }

  color: $c-soft-black;
}

tr {
  cursor: pointer;
  &:hover {
    background-color: lighten($c-information-blue, 50%);
    color: var(--hover-text-color);
  }

  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 2px 0px 2px 8px;
  color: var(--text-color);
}

hr {
  margin: 0;
  border: 1px solid $c-background-grey;
  width: 100%;
}

.main-container {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: [avatar-info] 0.95fr [menu-button] 0.05fr;
  grid-column-gap: 4px;
  align-items: center;
  width: 100%;

  &--mobile {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
}

.user-avatar {
  grid-row: 1;
  grid-column: avatar-info;
}

.session-status-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  span {
    color: $c-secondary-grey;
    font-size: 14px;
    line-height: 1.15;
    margin-bottom: 0;
    white-space: nowrap;
  }
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

  &--mobile {
    margin-right: 8px;
  }
}

.user-menu-toggle {
  margin-bottom: 12px;
}

.leave-queue-confirmation {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 228px;
  padding: 3px;

  p {
    margin: 0;
    font-size: 14px;
    font-weight: $font-weight-medium;
    line-height: 1.3;
  }

  &__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  &--mobile {
    width: 100%;
    padding: 8px;
    gap: 16px;

    p {
      @include font-category('body');
    }

    .leave-queue-confirmation__buttons {
      gap: 12px;
    }

    .confirmation-btn {
      @include font-category('button');
      flex: 1;
      min-height: 44px;
    }
  }
}

.confirmation-btn {
  padding: 4px 12px;
  border-radius: $radius-lg;
  font-size: 14px;
  font-weight: $font-weight-medium;

  &--secondary {
    color: var(--secondary-text-color);
    border: 1px solid $c-border-grey;
  }

  &--primary {
    color: white;
    background-color: $c-information-blue;
  }
}

.anchored-error-toast {
  --max-width: 300px;
  --start: -40%;
  --color: #791f1f;
  --background: #fcebeb;
  --border-style: solid;
  --border-width: 1px;
  --border-color: $c-error-red;
  --border-radius: 12px;
}

.error {
  color: #791f1f;
  background-color: #fcebeb;
  border: 1px solid $c-error-red;
  padding: 8px;
  border-radius: 12px;
  text-align: center;
}
</style>
