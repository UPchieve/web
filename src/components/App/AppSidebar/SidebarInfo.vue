<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import UserAvatarMenu from '@/components/UserAvatarMenu/index.vue'

const $store = useStore()

const isAuthenticated = computed(() => $store.getters['user/isAuthenticated'])
const isUserMenuOpen = ref<boolean>(false)
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
    >
      <UserAvatarMenu
        id="user-avatar-menu"
        :showSessionStatusLabel="false"
        :showAccountModeLabel="true"
        v-model:isMenuOpen="isUserMenuOpen"
        activatorId="info-container"
      />
    </div>
    <hr class="ml-2 mr-2" />
  </div>
</template>

<style lang="scss" scoped>
.info-container {
  @include flex-container(row, center, center);
  padding: 25px 20px 15px 12px;
  position: relative;

  &:hover {
    .avatar {
      height: 47px;
      width: 47px;
    }
  }
}

.avatar {
  height: 45px;
  width: 45px;
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
  color: var(--text-color);
  margin-top: 4px;
  margin-bottom: 0px;
}

hr {
  margin: 0;
  border: 1px solid $c-background-grey;
}
</style>
