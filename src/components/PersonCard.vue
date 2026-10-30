<template>
  <div class="person-card">
    <div class="person-card__avatar">
      <component :is="config.icon" class="person-card__icon" />
    </div>
    <h2 class="person-card__name" data-testid="person-card-name">{{ name }}</h2>

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
import { computed } from 'vue'
import CoachIcon from '@/assets/user_avatars/volunteer-icon.svg'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import { dayjs, minutesToHoursAndMinutes } from '@/utils/time-utils'

type PartnerType = 'coach' | 'student'

export interface LastSession {
  subject: string
  date: string | Date
  durationMinutes: number
}

const props = defineProps<{
  type: PartnerType
  name: string
  lastSession?: LastSession | null
}>()

const CARD_CONFIG = {
  coach: { icon: CoachIcon },
  student: { icon: StudentIcon },
} as const

const config = computed(() => CARD_CONFIG[props.type])

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

  &__icon {
    width: 70px;
    height: 70px;
  }

  &__name {
    grid-area: name;
    font-size: 18px;
    font-weight: 500;
    color: $c-soft-black;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    gap: 12px;
    margin-top: 12px;

    @include breakpoint-above('medium') {
      justify-self: end;
      margin-top: 0;
    }
  }
}
</style>
