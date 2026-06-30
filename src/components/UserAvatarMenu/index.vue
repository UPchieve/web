<script lang="ts" setup>
import { useStore } from 'vuex'
import { computed } from 'vue'
import Menu from '@/components/Menu.vue'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'
import UserAvatar from '@/components/UserAvatarMenu/UserAvatar.vue'

const props = withDefaults(
  defineProps<{
    showAccountModeLabel: boolean
    showSessionStatusLabel: boolean
    isMenuOpen: boolean
    activatorId: string
  }>(),
  {
    showAccountModeLabel: true,
    showSessionStatusLabel: true,
    isMenuOpen: false,
  }
)

const store = useStore()
const router = useRouter()

const sessionStatus = computed(() => store.getters['session/sessionStatus'])
const isMobileMode = computed(() => store.getters['app/mobileMode'])

// @TODO: Use me to create 2nd variant
// const canSwitchAccountModes = computed(
//   (): boolean => store.getters['user/isStudentVolunteer']
// )

// Menu
function goTo(path: string) {
  isMenuOpen.value = false
  router.push(path)
}

function logout() {
  isMenuOpen.value = false
  AuthService.logout({ $router: router, $store: store })
}

const emit = defineEmits(['update:isMenuOpen'])
const isMenuOpen = computed({
  get: () => props.isMenuOpen,
  set: (value) => emit('update:isMenuOpen', value),
})
</script>

<template>
  <div
    class="main-container"
    :class="{
      'main-container--mobile': isMobileMode,
    }"
  >
    <UserAvatar class="user-avatar" :showSessionStatusLabel="false" />
    <Menu
      v-model:isOpen="isMenuOpen"
      class="user-menu"
      location="bottom center"
      caretThickness="regular"
      :buttonHeightPx="12"
      transition="slide-y-transition"
      :activatorId="props.activatorId"
    >
      <template v-slot:content>
        <div
          :class="[
            'menu-content-container',
            { 'menu-content-container--mobile': isMobileMode },
          ]"
        >
          <!--          On mobile, also show the avatar in the drawer/modal since the drawer will cover the other one-->
          <UserAvatar
            class="user-avatar"
            v-if="isMobileMode"
            :showAccountModeLabel="false"
            :showIndicatorRing="false"
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
          <hr />
          <div
            class="menu-row"
            role="button"
            tabindex="0"
            @click.stop="goTo('/profile')"
            @keydown.stop.enter="goTo('/profile')"
            data-testid="menu-row-profile"
          >
            Profile
          </div>
          <hr />
          <div
            class="menu-row"
            role="button"
            tabindex="0"
            @click.stop="logout"
            @keydown.stop.enter="logout"
            data-testid="menu-row-logout"
          >
            Log out of UPchieve
          </div>
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

.menu-row {
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
  grid-template-columns: [avatar] 0.3fr [details] 0.4fr [menu-button] 0.3fr;
  grid-column-gap: 8px;
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
  grid-column: avatar;
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
</style>
