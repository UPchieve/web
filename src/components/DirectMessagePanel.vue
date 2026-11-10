<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Modal from '@/components/Modal.vue'
import DirectMessageChat from '@/components/DirectMessageChat.vue'
import HeavyCrossIcon from '@/assets/heavy-cross.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import CoachAvatar from '@/components/CoachAvatar.vue'
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import { avatarColor, AVATAR_TEXT_COLOR } from '@/components/NTHS/member-avatar'
import type { VolunteerStatus } from '@/types/users'
import store from '@/store'

const props = defineProps<{
  partnerId: string
  partnerName: string
  partnerType: 'coach' | 'student'
  status?: VolunteerStatus
}>()

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const isOpen = ref(true)
let previouslyFocused: HTMLElement | null = null

const STATUS_LABELS: Record<VolunteerStatus, string> = {
  online: 'Online now',
  'in-session': 'In session',
  offline: 'Offline',
}

const isShowCoachStatusEnabled = computed(
  () => store.getters['featureFlags/isShowCoachStatusEnabled']
)

const statusLabel = computed(() =>
  props.status && isShowCoachStatusEnabled.value
    ? STATUS_LABELS[props.status]
    : ''
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
          <div class="dm-panel__identity">
            <CoachAvatar
              v-if="partnerType === 'coach'"
              class="dm-panel__avatar"
              :status="status"
              :size="56"
            >
              <template v-if="$slots['avatar-badge']" #badge>
                <slot name="avatar-badge" />
              </template>
            </CoachAvatar>
            <InitialsAvatar
              v-else
              class="dm-panel__avatar"
              :initials="partnerName.charAt(0).toUpperCase()"
              :widthPx="56"
              :bgColor="avatarColor(partnerId)"
              :fgColor="AVATAR_TEXT_COLOR"
            />
            <div class="dm-panel__name-group">
              <h2 class="dm-panel__name">{{ partnerName }}</h2>
              <span
                v-if="statusLabel"
                :class="['dm-panel__status', `dm-panel__status--${status}`]"
                data-testid="dm-panel-status"
                >{{ statusLabel }}</span
              >
            </div>
            <button
              type="button"
              class="dm-panel__close"
              aria-label="Close messages"
              data-testid="dm-panel-close"
              @click="close"
            >
              <HeavyCrossIcon class="dm-panel__close-icon" />
            </button>
          </div>
          <div
            v-if="$slots.actions"
            class="dm-panel__actions"
            data-testid="dm-panel-actions"
          >
            <slot name="actions" />
          </div>
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
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    border-bottom: 1px solid $c-border-grey;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__name-group {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__status {
    font-size: 14px;
    font-weight: 500;
    color: $c-secondary-grey;

    &--online {
      color: $c-hover-green;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;

    :deep(.ButtonTemplate) {
      width: 100%;
    }
  }

  &__name {
    @include font-category('display-small');
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
