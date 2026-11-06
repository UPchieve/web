<script lang="ts" setup>
import type { VolunteerStatus } from '@/types/users'

defineProps<{
  status: VolunteerStatus
}>()
</script>

<template>
  <span
    :class="['presence-dot', `presence-dot--${status}`]"
    data-testid="presence-dot"
    aria-hidden="true"
  />
</template>

<style lang="scss" scoped>
.presence-dot {
  display: block;
  width: 16px;
  height: 16px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-sizing: border-box;

  &--online {
    background-color: $c-success-green;
  }

  &--in-session {
    background-color: $c-warning-orange;
  }

  &--offline {
    background-color: $c-disabled-grey;
  }
}
</style>
