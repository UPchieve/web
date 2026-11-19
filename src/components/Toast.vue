<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import type { Anchor } from 'vuetify'
import CrossIcon from '@/assets/cross.svg'

export type ToastProps = {
  message: string
  /**
   * If set, auto-dismisses the toast after this duration.
   * Otherwise, the toast stays open until it's dismissed.
   */
  durationMs?: number
  location?: Anchor
}

const props = withDefaults(defineProps<ToastProps>(), {
  location: 'bottom',
})

/** Whether the toast is showing. Set to false when it times out. */
const isOpen = defineModel<boolean>('isOpen', { required: true })

// Callers may clear the state as soon as it closes, which
// would swap its content mid leave-transition. So this only follow prop changes while
// open, so the toast keeps showing what it showed until it's fully gone.
const shown = ref({ message: props.message, durationMs: props.durationMs })
watchEffect(() => {
  if (isOpen.value) {
    shown.value = { message: props.message, durationMs: props.durationMs }
  }
})

// Vuetify treats a timeout of -1 as "never auto-dismiss"
const timeout = computed(() => shown.value.durationMs ?? -1)
const showDismissButton = computed(() => timeout.value <= 0)

const emit = defineEmits(['dismiss'])
function dismiss() {
  isOpen.value = false
  emit('dismiss')
  // @TODO Posthog event
}
</script>

<template>
  <v-snackbar v-model="isOpen" :timeout="timeout" :location="props.location">
    {{ shown.message }}
    <template v-slot:actions>
      <button
        v-if="showDismissButton"
        class="dismiss-button"
        @click="dismiss"
        type="button"
      >
        <CrossIcon class="dismiss-icon" />
      </button>
    </template>
  </v-snackbar>
</template>

<style lang="scss" scoped>
.v-snackbar {
  padding-bottom: 16px;
}

:deep(.v-snackbar__wrapper) {
  min-width: 0;
  color: white;
  background-color: $c-soft-black;
  border-radius: $radius-lg;
}

:deep(.v-snackbar__content) {
  @include font-category('subheading');
  text-align: center;
}

.dismiss-button {
  padding: 8px;
  display: flex;
  flex-direction: column;

  .dismiss-icon {
    height: 16px;
    width: 16px;
    :deep(path) {
      fill: white;
    }
  }
}
</style>
