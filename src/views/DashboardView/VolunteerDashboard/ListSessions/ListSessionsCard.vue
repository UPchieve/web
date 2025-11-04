<script lang="ts">
export function getShowLockedSessionKey(userId?: string) {
  return `SHOW_LOCKED_SESSIONS-${userId}`
}
</script>

<script lang="ts" setup>
import TaskCard from '@/components/TaskCard.vue'
import WebNotificationsButton from '@/components/WebNotificationsButton.vue'
import ListSessions from '@/views/DashboardView/VolunteerDashboard/ListSessions/ListSessions.vue'
import { useStore } from 'vuex'
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import Caret from '@/assets/right-caret.svg'
import { IonModal } from '@ionic/vue'
import MenuContent from '@/views/DashboardView/VolunteerDashboard/ListSessions/MenuContent.vue'

const store = useStore()
const router = useRouter()
const isSkipAvailabilityOnboardingRequirementEnabled = computed(
  () =>
    store.getters['featureFlags/isSkipAvailabilityOnboardingRequirementEnabled']
)
const isSessionAlive = computed(() => store.getters['user/isSessionAlive'])
const sessionPath = computed(() => store.getters['user/sessionPath'])
const isShowLockedSessionsEnabled = computed(
  () => store.getters['featureFlags/isShowLockedSessionsEnabled']
)
const mobileMode = computed(() => store.getters['app/mobileMode'])

const props = defineProps<{
  notificationsCardWasDismissed: false
}>()

// Menu logic
const shouldShowMenu = computed(() => {
  // This is the only menu content for now, and it's driven by a FF.
  // Once this is fully rolled out, we can drop shouldShowMenu since it
  // will always be true.
  return isShowLockedSessionsEnabled.value
})
const isMenuOpen = ref<boolean>(false)
const listSessionsMenu = ref(null)
function toggleIsMenuOpen() {
  isMenuOpen.value = !isMenuOpen.value
}
function closeMenu() {
  isMenuOpen.value = false
}
// Toggle logic
const showLockedSessions = ref<boolean>(false)
const showLockedSessionsKey = computed(() => {
  return getShowLockedSessionKey(store.state.user.user?.id)
})
const shouldShowLockedSessions = computed(() => {
  if (!isShowLockedSessionsEnabled.value) return false
  const localStorageValue = localStorage.getItem(showLockedSessionsKey.value)
  return localStorageValue ? JSON.parse(localStorageValue) : false
})

function toggleShowLockedSessions() {
  showLockedSessions.value = !showLockedSessions.value
  localStorage.setItem(
    showLockedSessionsKey.value,
    JSON.stringify(showLockedSessions.value)
  )
}

onBeforeMount(() => {
  showLockedSessions.value = shouldShowLockedSessions.value
})

function rejoinHelpSession() {
  const path = sessionPath.value
  if (path) {
    router.push(path)
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div>
    <TaskCard
      title="Waiting Students"
      subtitle="Students waiting for help will show up below"
    >
      <template v-slot:heading-content>
        <div v-if="isShowLockedSessionsEnabled" class="heading-content">
          <Caret
            v-if="shouldShowMenu"
            role="button"
            @click="toggleIsMenuOpen"
            :class="{
              caret: true,
              'caret--open': isMenuOpen,
            }"
          />
          <div
            v-if="isMenuOpen && !mobileMode"
            class="list-sessions-menu"
            ref="listSessionsMenu"
          >
            <MenuContent
              :showLockedSessions="showLockedSessions"
              @toggleShowLockedSessions="toggleShowLockedSessions"
            />
          </div>
          <div v-else-if="isMenuOpen">
            <IonModal
              :isOpen="isMenuOpen"
              @didDismiss="closeMenu"
              :initial-breakpoint="0.9"
              :breakpoints="[0, 0.9]"
              :backdrop-dismiss="true"
              :can-dismiss="true"
              presentation="sheet"
            >
              <MenuContent
                :showLockedSessions="showLockedSessions"
                @toggleShowLockedSessions="toggleShowLockedSessions"
              />
            </IonModal>
          </div>
        </div>
        <div class="notifications-button-container">
          <WebNotificationsButton
            v-if="
              !isSkipAvailabilityOnboardingRequirementEnabled ||
              props.notificationsCardWasDismissed
            "
            class="notifications-button"
          />
        </div>
      </template>
      <template v-slot:content>
        <div class="waiting-students-content">
          <div class="available-sessions-container sessions-list-container">
            <ListSessions
              v-if="!isSessionAlive"
              :showLockedSessions="showLockedSessions"
            />
            <div v-else class="rejoin-session-container">
              <button
                class="btn rejoinSessionBtn"
                type="button"
                @click.prevent="rejoinHelpSession()"
              >
                Rejoin your coaching session
              </button>
            </div>
          </div>
        </div>
      </template>
    </TaskCard>
  </div>
</template>

<style lang="scss" scoped>
.waiting-students-content {
  width: 100%;
}

.heading-content {
  display: flex;
  width: 100%;
  position: relative;

  .caret {
    margin-left: auto;
    transform: rotate(90deg);
    transition: 200ms linear;
    width: 8px;

    &--open {
      transform: rotate(-90deg);
    }
  }
}

.list-sessions-menu {
  right: 0;
  transform: translateX(
    calc(50% - 4px)
  ); // 4px is the width of the 1/2 caret. This centers the menu on the caret.
  top: 100%;
  background: white;
  border: 2px solid #f1f3f6;
  border-radius: 8px;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.1);
  padding: 10px 0;
  position: absolute;
  z-index: 1;
}
</style>
