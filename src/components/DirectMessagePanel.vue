<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Modal from '@/components/Modal.vue'
import DirectMessageChat from '@/components/DirectMessageChat.vue'
import HeavyCrossIcon from '@/assets/heavy-cross.svg'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const props = defineProps<{
  partnerId: string
  partnerName: string
  partnerType: 'coach' | 'student'
}>()

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const isOpen = ref(true)
let previouslyFocused: HTMLElement | null = null

const partnerAvatar = computed(() =>
  props.partnerType === 'coach' ? VolunteerIcon : StudentIcon
)

// Slide out first; `close` is emitted once the transition ends
function close() {
  isOpen.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

// Panel is off screen while it slides in. We prevent scroll to prevent
// the panel from jumping/glitching
onMounted(async () => {
  AnalyticsService.captureEvent(EVENTS.DM_CONVERSATION_OPENED, {
    partnerId: props.partnerId,
    partnerType: props.partnerType,
  })
  window.addEventListener('keydown', handleKeydown)
  previouslyFocused = document.activeElement as HTMLElement | null
  await nextTick()
  panel.value?.focus({ preventScroll: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  previouslyFocused?.focus()
})
</script>

<template>
  <Transition name="dm-panel" appear @after-leave="emit('close')">
    <modal
      v-if="isOpen"
      side-panel
      :close-modal="close"
      data-testid="dm-panel-scrim"
    >
      <section
        ref="panel"
        class="dm-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="`Messages with ${partnerName}`"
        tabindex="-1"
      >
        <header class="dm-panel__header">
          <component :is="partnerAvatar" class="dm-panel__avatar" />
          <h2 class="dm-panel__name">{{ partnerName }}</h2>
          <button
            type="button"
            class="dm-panel__close"
            aria-label="Close messages"
            data-testid="dm-panel-close"
            @click="close"
          >
            <HeavyCrossIcon class="dm-panel__close-icon" />
          </button>
        </header>
        <DirectMessageChat
          class="dm-panel__chat"
          :partner-id="partnerId"
          :partner-name="partnerName"
        />
      </section>
    </modal>
  </Transition>
</template>

<style lang="scss" scoped>
.dm-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  outline: none;

  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    border-bottom: 1px solid $c-border-grey;
  }

  &__avatar {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
  }

  &__name {
    @include font-category('display-small');
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__close {
    display: grid;
    place-items: center;
    padding: 4px;
    background: none;
    border: none;
    cursor: pointer;
  }

  &__close-icon {
    width: 18px;

    :deep(g) {
      stroke: $c-secondary-grey;
      stroke-width: 2;
    }
  }

  &__chat {
    flex: 1;
    min-height: 0;
  }
}

.dm-panel-enter-active,
.dm-panel-leave-active {
  transition: background-color 0.25s ease;

  :deep(.upc-modal-form) {
    transition: transform 0.25s ease;
  }
}

.dm-panel-enter-from,
.dm-panel-leave-to {
  background-color: transparent;

  :deep(.upc-modal-form) {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dm-panel-enter-active,
  .dm-panel-leave-active,
  .dm-panel-enter-active :deep(.upc-modal-form),
  .dm-panel-leave-active :deep(.upc-modal-form) {
    transition: none;
  }
}
</style>
