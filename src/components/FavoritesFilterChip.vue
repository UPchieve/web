<script lang="ts" setup>
import StarIcon from '@/assets/icons/star_icon.svg'
import StarFilledIcon from '@/assets/icons/star_icon_filled.svg'
import ToggleChip from '@/components/PresentationComponents/ToggleChip.vue'

const props = withDefaults(
  defineProps<{
    value: boolean
    label?: string
  }>(),
  {
    value: false,
    label: 'Favorites',
  }
)

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
    data-testid="favorites-only-toggle"
    @click="toggle"
  >
    <template #icon>
      <StarFilledIcon
        v-if="value"
        class="favorites-chip__icon favorites-chip__icon--active"
        aria-hidden="true"
      />
      <StarIcon v-else class="favorites-chip__icon" aria-hidden="true" />
    </template>
    <span>{{ label }}</span>
  </ToggleChip>
</template>

<style lang="scss" scoped>
.favorites-chip__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;

  :deep(path) {
    fill: $c-soft-black;
  }

  &--active :deep(path) {
    fill: $c-information-blue;
  }
}
</style>
