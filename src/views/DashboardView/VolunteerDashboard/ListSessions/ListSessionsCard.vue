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
import MenuContent from '@/views/DashboardView/VolunteerDashboard/ListSessions/MenuContent.vue'
import Menu from '@/components/Menu.vue'
import LargeButton from '@/components/LargeButton.vue'
import { rejoinSession } from '@/utils/session'

const store = useStore()
const router = useRouter()
const isSessionAlive = computed(() => store.getters['user/isSessionAlive'])
const sessionPath = computed(() => store.getters['user/sessionPath'])

const props = defineProps<{
  notificationsCardWasDismissed: false
  sessionClickOverride?: (arg: any) => void
}>()

const showLockedSessions = ref<boolean>(true)
const showLockedSessionsKey = computed(() => {
  return getShowLockedSessionKey(store.state.user.user?.id)
})
const shouldShowLockedSessions = computed(() => {
  const localStorageValue: string | null = localStorage.getItem(
    showLockedSessionsKey.value
  )
  if (!localStorageValue) return showLockedSessions.value
  return JSON.parse(localStorageValue)
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
  rejoinSession(
    {
      $router: router,
      $store: store,
    },
    sessionPath.value,
    store.getters['user/userType'],
    store.getters['user/roleInCurrentSession']
  )
}

// Menu
const isMenuOpen = ref<boolean>(false)
function toggleMenuOpen(value: boolean) {
  isMenuOpen.value = value
}
</script>

<template>
  <div>
    <TaskCard
      title="Waiting Students"
      subtitle="Students waiting for help will show up below"
    >
      <template v-slot:heading-content>
        <div class="heading-content">
          <Menu
            location="bottom start"
            :buttonHeightPx="20"
            caretThickness="bold"
            :isOpen="isMenuOpen"
            @update:isOpen="toggleMenuOpen"
          >
            <template v-slot:content>
              <MenuContent
                :showLockedSessions="showLockedSessions"
                @toggleShowLockedSessions="toggleShowLockedSessions"
              />
            </template>
          </Menu>
        </div>
        <div class="notifications-button-container">
          <WebNotificationsButton
            v-if="props.notificationsCardWasDismissed"
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
              :sessionClickOverride="props.sessionClickOverride"
            />
            <div v-else class="rejoin-session-container">
              <LargeButton
                variant="primary-blue"
                type="button"
                @click.prevent="rejoinHelpSession()"
              >
                Rejoin your coaching session
              </LargeButton>
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
  position: relative;
  margin-left: auto;
}
.rejoin-session-container {
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
