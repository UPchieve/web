<script lang="ts" setup>
import ToggleChip from '@/components/PresentationComponents/ToggleChip.vue'

const props = defineProps<{
  value: boolean
  count: number
}>()

const emit = defineEmits<{
  change: [{ value: boolean }]
}>()

function toggle() {
  emit('change', { value: !props.value })
}
</script>

<template>
  <ToggleChip
    :active="value"
    :aria-label="`Unread, ${count}`"
    data-testid="unread-only-toggle"
    @click="toggle"
  >
    <template #icon>
      <span class="unread-chip__dot" aria-hidden="true" />
    </template>
    <span>Unread</span>
    <span
      class="unread-chip__count"
      :class="{ 'unread-chip__count--active': value }"
      data-testid="unread-count"
    >
      {{ count }}
    </span>
  </ToggleChip>
</template>

<style lang="scss" scoped>
.unread-chip {
  &__dot {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: $c-warning-orange;
  }

  &__count {
    font-weight: 400;
    color: $c-secondary-grey;

    &--active {
      color: $c-information-blue;
    }
  }
}
</style>
