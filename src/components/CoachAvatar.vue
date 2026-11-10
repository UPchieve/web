<script lang="ts" setup>
import { computed } from 'vue'
import CoachIcon from '@/assets/user_avatars/volunteer-icon.svg'
import PresenceDot from '@/components/PresenceDot.vue'
import type { VolunteerStatus } from '@/types/users'
import store from '@/store'

const props = withDefaults(
  defineProps<{
    status?: VolunteerStatus
    size?: number
  }>(),
  { size: 70 }
)

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}))

const isShowCoachStatusEnabled = computed(
  () => store.getters['featureFlags/isShowCoachStatusEnabled']
)
</script>

<template>
  <div class="coach-avatar" :style="sizeStyle" data-testid="coach-avatar">
    <CoachIcon class="coach-avatar__icon" aria-hidden="true" />
    <div
      v-if="$slots.badge"
      class="coach-avatar__badge"
      data-testid="coach-avatar-badge"
    >
      <slot name="badge" />
    </div>
    <PresenceDot
      v-if="status && isShowCoachStatusEnabled"
      class="coach-avatar__presence-dot"
      :status="status"
    />
  </div>
</template>

<style lang="scss" scoped>
.coach-avatar {
  position: relative;
  flex-shrink: 0;

  &__icon {
    width: 100%;
    height: 100%;
  }

  &__badge {
    position: absolute;
    top: -6px;
    left: -6px;
    z-index: 1;
  }

  &__presence-dot {
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
}
</style>
