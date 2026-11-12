<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import Modal from '@/components/Modal.vue'
import DirectMessageChat from '@/components/DirectMessageChat.vue'
import DirectMessageReport from '@/components/DirectMessageReport.vue'
import VerticalMenuIcon from '@/assets/VerticalMenuButtons.svg'
import ReportIcon from '@/assets/voice_message_icons/report.svg'
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
const conversationId = ref<string | null>(null)
const isReporting = ref(false)
const reportDialog = ref<HTMLElement | null>(null)
const isMenuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const firstMenuItem = ref<HTMLButtonElement | null>(null)
const menuId = `dm-conversation-menu-${useId()}`
const isReportSubmitting = ref(false)
const isReportSubmitted = ref(false)
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
  if (isReporting.value || isReportSubmitting.value) return
  isOpen.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (isReportSubmitting.value) return
  if (event.key === 'Escape') {
    if (isMenuOpen.value) {
      closeMenu()
      return
    }
    if (isReporting.value) {
      closeReport()
    } else {
      close()
    }
  }
}

async function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
  if (isMenuOpen.value) {
    await nextTick()
    firstMenuItem.value?.focus()
  }
}

function closeMenu() {
  isMenuOpen.value = false
  menuButton.value?.focus()
}

function closeMenuOnOutsideClick(event: PointerEvent) {
  if (!menuRoot.value?.contains(event.target as Node)) {
    isMenuOpen.value = false
  }
}

function closeMenuOnFocusLeave(event: FocusEvent) {
  if (!menuRoot.value?.contains(event.relatedTarget as Node | null)) {
    isMenuOpen.value = false
  }
}

async function startReporting() {
  isMenuOpen.value = false
  isReportSubmitted.value = false
  isReporting.value = true
  await nextTick()
  reportDialog.value?.querySelector<HTMLElement>('select, button')?.focus()
}

async function closeReport() {
  if (isReportSubmitting.value) return
  isReporting.value = false
  await nextTick()
  // The chat panel is still open behind the report modal.
  document.body.classList.add('disable-scroll')
  menuButton.value?.focus()
}

function handleReportTab(event: KeyboardEvent) {
  const elements = reportDialog.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), select:not([disabled]), textarea:not([disabled])'
  )
  if (!elements?.length) {
    event.preventDefault()
    return
  }
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function handleReportSubmitted() {
  isReportSubmitting.value = false
  closeReport()
  isReportSubmitted.value = true
}

// Panel is off screen while it slides in. We prevent scroll to prevent
// the panel from jumping/glitching
onMounted(async () => {
  AnalyticsService.captureEvent(EVENTS.DM_CONVERSATION_OPENED, {
    partnerId: props.partnerId,
    partnerType: props.partnerType,
  })
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('pointerdown', closeMenuOnOutsideClick)
  previouslyFocused = document.activeElement as HTMLElement | null
  await nextTick()
  panel.value?.focus({ preventScroll: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('pointerdown', closeMenuOnOutsideClick)
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
        :inert="isReporting || undefined"
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
            <div
              ref="menuRoot"
              class="dm-panel__menu"
              @keydown.esc.stop.prevent="closeMenu"
              @keydown.tab="isMenuOpen = false"
              @focusout="closeMenuOnFocusLeave"
            >
              <button
                ref="menuButton"
                type="button"
                class="dm-panel__menu-button"
                :class="{ 'dm-panel__menu-button--open': isMenuOpen }"
                data-testid="dm-menu"
                :aria-label="`More options for ${partnerName}`"
                aria-haspopup="menu"
                :aria-expanded="isMenuOpen"
                :aria-controls="isMenuOpen ? menuId : undefined"
                :disabled="!conversationId"
                @click="toggleMenu"
                @keydown.down.prevent="isMenuOpen || toggleMenu()"
              >
                <VerticalMenuIcon aria-hidden="true" />
              </button>
              <div
                v-if="isMenuOpen"
                :id="menuId"
                class="dm-panel__menu-popup"
                role="menu"
                :aria-label="`Options for ${partnerName}`"
                @keydown.down.prevent="firstMenuItem?.focus()"
                @keydown.up.prevent="firstMenuItem?.focus()"
              >
                <button
                  ref="firstMenuItem"
                  type="button"
                  role="menuitem"
                  tabindex="-1"
                  class="dm-panel__report"
                  data-testid="dm-report"
                  @click="startReporting"
                >
                  <ReportIcon aria-hidden="true" />
                  Report {{ partnerName }}
                </button>
              </div>
            </div>
            <button
              type="button"
              class="dm-panel__close"
              aria-label="Close messages"
              data-testid="dm-panel-close"
              :disabled="isReportSubmitting"
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
        <p
          v-if="isReportSubmitted"
          role="status"
          class="dm-panel__report-status"
        >
          Your report has been submitted to UPchieve.
        </p>
        <DirectMessageChat
          class="dm-panel__chat"
          :partner-id="partnerId"
          :partner-name="partnerName"
          @conversation-ready="conversationId = $event"
        />
      </section>
    </modal>
  </Transition>
  <Teleport to="ion-app">
    <Modal
      v-if="isReporting && conversationId"
      :close-modal="closeReport"
      class="dm-report-modal"
      data-testid="dm-report-modal"
    >
      <div
        ref="reportDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-report-title"
        @keydown.tab="handleReportTab"
      >
        <DirectMessageReport
          :conversation-id="conversationId"
          :partner-type="partnerType"
          @cancel="closeReport"
          @submitted="handleReportSubmitted"
          @submitting="isReportSubmitting = $event"
        />
      </div>
    </Modal>
  </Teleport>
</template>

<style lang="scss" scoped>
.dm-report-modal {
  @include breakpoint-above('medium') {
    :deep(.upc-modal-form) {
      padding: 0;
    }
  }
}

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

  &__menu {
    position: relative;
    flex-shrink: 0;
  }

  &__menu-button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    cursor: pointer;

    &:hover,
    &--open {
      background-color: $c-background-grey;
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }

  &__menu-popup {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 2;
    min-width: 220px;
    max-width: calc(100vw - 64px);
    padding: 8px;
    border: 1px solid $c-border-grey;
    border-radius: 12px;
    background: $upchieve-white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &__report {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 6px;
    background: none;
    color: $c-soft-black;
    text-align: left;
    font: inherit;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background-color: $c-background-grey;
    }

    svg {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    :deep(path) {
      fill: none;
      stroke: currentColor;
    }
  }

  &__report-status {
    padding: 16px 24px;
    margin: 0;
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
