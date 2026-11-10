<template>
  <div class="person-card">
    <div class="person-card__avatar">
      <InitialsAvatar
        v-if="type === 'student'"
        :initials="name.charAt(0).toUpperCase()"
        :widthPx="60"
        :bgColor="avatarColor(userId ?? name)"
        :fgColor="AVATAR_TEXT_COLOR"
      />
      <CoachAvatar v-else :status="status">
        <template v-if="$slots['avatar-badge']" #badge>
          <slot name="avatar-badge" />
        </template>
      </CoachAvatar>
    </div>
    <div class="person-card__name-row">
      <div
        v-if="hasNamePopover || nameClickable"
        ref="nameTriggerRef"
        class="person-card__name-trigger"
        @pointerenter="onPointerEnter"
        @pointerleave="onPointerLeave"
        @focusout="onFocusOut"
        @keydown.esc="closeNamePopover"
      >
        <h2 class="person-card__name" data-testid="person-card-name">
          <button
            type="button"
            class="person-card__name-button"
            :class="{ 'person-card__name-button--open': isNamePopoverOpen }"
            :aria-expanded="hasNamePopover ? isNamePopoverOpen : undefined"
            :aria-controls="hasNamePopover ? namePopoverId : undefined"
            data-testid="person-card-name-button"
            @pointerdown="lastPointerType = $event.pointerType"
            @focus="onFocus"
            @click="onNameClick"
          >
            {{ name }}
          </button>
        </h2>
        <div
          v-if="hasNamePopover"
          v-show="isNamePopoverOpen"
          :id="namePopoverId"
          class="person-card__name-popover"
          data-testid="person-card-name-popover"
        >
          <slot name="name-popover" />
        </div>
      </div>
      <h2 v-else class="person-card__name" data-testid="person-card-name">
        {{ name }}
      </h2>
      <span
        v-if="status && STATUS_LABELS[status] && isShowCoachStatusEnabled"
        class="person-card__status"
        data-testid="person-card-status"
        >{{ STATUS_LABELS[status] }}</span
      >
    </div>

    <div class="person-card__last-session">
      <span class="person-card__label">Last session</span>
      <span v-if="lastSessionInfo.length" class="person-card__details">
        <template v-for="(info, i) in lastSessionInfo" :key="i">
          <span v-if="i > 0" class="person-card__dot" aria-hidden="true"
            >•</span
          >
          <span data-testid="person-card-detail">{{ info }}</span>
        </template>
      </span>
      <span
        v-else
        class="person-card__details"
        data-testid="person-card-no-session"
        >—</span
      >
    </div>

    <div
      v-if="$slots.actions"
      class="person-card__actions"
      data-testid="person-card-actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, useId, useSlots, watch } from 'vue'
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import CoachAvatar from '@/components/CoachAvatar.vue'
import type { VolunteerStatus } from '@/types/users'
import { avatarColor, AVATAR_TEXT_COLOR } from '@/components/NTHS/member-avatar'
import { dayjs, minutesToHoursAndMinutes } from '@/utils/time-utils'
import store from '@/store'

type PartnerType = 'coach' | 'student'

export interface LastSession {
  subject: string
  date: string | Date
  durationMinutes: number
}

const props = defineProps<{
  type: PartnerType
  name: string
  userId?: string
  lastSession?: LastSession | null
  status?: VolunteerStatus
  nameClickable?: boolean
}>()

const emit = defineEmits<{ 'name-click': [] }>()

const STATUS_LABELS: Partial<Record<VolunteerStatus, string>> = {
  'in-session': 'In session',
  offline: 'Offline',
}

function formatDuration(totalMinutes: number): string {
  const result = minutesToHoursAndMinutes(Math.max(1, Math.round(totalMinutes)))
  if (typeof result === 'string') return result
  const { hours, minutes } = result
  if (!hours) return `${minutes} min`
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`
}

const lastSessionInfo = computed(() => {
  const session = props.lastSession
  if (!session) return []

  const info: string[] = []
  if (session.subject) info.push(session.subject)

  const date = dayjs(session.date)
  if (date.isValid()) info.push(date.format('MMM D, YYYY'))

  if (Number.isFinite(session.durationMinutes)) {
    info.push(formatDuration(session.durationMinutes))
  }
  return info
})

const isShowCoachStatusEnabled = computed(
  () => store.getters['featureFlags/isShowCoachStatusEnabled']
)

const slots = useSlots()
const hasNamePopover = computed(() => !!slots['name-popover'])
const namePopoverId = `person-card-popover-${useId()}`
const nameTriggerRef = ref<HTMLElement | null>(null)
const isNamePopoverOpen = ref(false)
const lastPointerType = ref('')

function openNamePopover() {
  if (!hasNamePopover.value) return
  isNamePopoverOpen.value = true
}

function closeNamePopover() {
  isNamePopoverOpen.value = false
}

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse') openNamePopover()
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') closeNamePopover()
}

function onFocus() {
  if (!lastPointerType.value) openNamePopover()
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (!next || !nameTriggerRef.value?.contains(next)) closeNamePopover()
}

function onNameClick() {
  if (props.nameClickable) {
    lastPointerType.value = ''
    closeNamePopover()
    emit('name-click')
    return
  }

  if (lastPointerType.value === 'mouse') openNamePopover()
  else if (isNamePopoverOpen.value) closeNamePopover()
  else openNamePopover()
  lastPointerType.value = ''
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!nameTriggerRef.value?.contains(event.target as Node)) closeNamePopover()
}

watch(isNamePopoverOpen, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onDocumentPointerDown)
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<style lang="scss" scoped>
.person-card {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'avatar name'
    'avatar session'
    'actions actions';
  column-gap: 16px;
  row-gap: 4px;
  align-items: center;
  padding: 12px 24px;
  border: solid 1px $c-border-grey;
  border-radius: 16px;
  background-color: #fff;

  @include breakpoint-above('medium') {
    grid-template-columns: auto 200px minmax(0, 1fr) auto;
    grid-template-areas: 'avatar name session actions';
    column-gap: 12px;
  }

  &__avatar {
    grid-area: avatar;
    position: relative;
    width: 70px;
    height: 70px;
  }

  &__name-row {
    grid-area: name;
    display: flex;
    // The status drops below the name when they don't fit on one line
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 8px;
    row-gap: 2px;
    min-width: 0;
  }

  &__name {
    min-width: 0;
    font-size: 18px;
    font-weight: 500;
    color: $c-soft-black;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__name-trigger {
    position: relative;
    min-width: 0;
  }

  &__name-button {
    max-width: 100%;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;

    &:hover,
    &:focus-visible,
    &--open {
      text-decoration: underline;
    }
  }

  &__name-popover {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    padding-top: 8px;
  }

  &__status {
    flex-shrink: 0;
    font-size: 12px;
    color: $c-secondary-grey;
    font-weight: 500;
  }

  &__last-session {
    grid-area: session;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 12px;
    row-gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: $c-soft-black;
  }

  &__details {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 14px;
    color: $c-secondary-grey;

    @include breakpoint-above('medium') {
      font-size: 16px;
    }
  }

  &__dot {
    color: $c-secondary-grey;
  }

  &__actions {
    grid-area: actions;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;

    @include breakpoint-above('medium') {
      justify-self: end;
      margin-top: 0;
    }
  }
}
</style>
