import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import LoggerService from '@/services/LoggerService'
import errorFromHttpResponse from '@/utils/error-from-http-response'
import SessionService from '@/services/SessionService'

const SESSION_REQUEST_COOLDOWN_MS = 1000 * 60 * 5 // 5 minutes
const ONE_MINUTE_IN_MS = 1000 * 60

export type LatestSession = {
  id?: string
  createdAt: Date | string
  endedAt?: Date | string | null
  endedByUserId?: string
  volunteerId?: string
}

type Zwibbler = {
  save(data: { format: 'image/jpeg' | 'image/png' }): string
}

type JourneySessionData = {
  dropdownLabel: string
  key: string
  stepNumber: number
  title: string
  subject: string
}

export const useSessionStore = defineStore('session', () => {
  const isPartnerOnline = ref(false)
  const latestSession = ref<LatestSession>()
  const cooldownMinutes = ref(0)
  const journeySessionData = ref<JourneySessionData>()
  // shallowRef: a third-party whiteboard instance that must not be made reactive.
  const zwibbler = shallowRef<Zwibbler | null>(null)

  const hasCooldown = computed(() => cooldownMinutes.value > 0)

  function onlineStatusForPartner(flag: boolean) {
    isPartnerOnline.value = flag
  }

  function calculateCooldown(): number {
    const session = latestSession.value
    const hasNoLatestSession = !session
    const isSessionOngoing = !session?.endedAt
    const wasSessionEndedByVolunteer =
      !!session?.volunteerId &&
      !!session?.endedByUserId &&
      session?.volunteerId === session?.endedByUserId
    if (hasNoLatestSession || isSessionOngoing || wasSessionEndedByVolunteer) {
      return 0
    }

    const sessionCreatedAtMs = new Date(session.createdAt).getTime()
    const currentTimeMs = new Date().getTime()
    const timeSinceLastSessionStartedMs = currentTimeMs - sessionCreatedAtMs
    if (timeSinceLastSessionStartedMs >= SESSION_REQUEST_COOLDOWN_MS) return 0

    const diffInMs = SESSION_REQUEST_COOLDOWN_MS - timeSinceLastSessionStartedMs
    return Math.ceil(Math.max(0, diffInMs / 60000))
  }

  function setCooldown(): number {
    const cooldown = calculateCooldown()
    cooldownMinutes.value = cooldown
    return cooldown
  }

  let cooldownInterval: ReturnType<typeof setInterval> | undefined

  function stopCooldownInterval() {
    clearInterval(cooldownInterval)
    cooldownInterval = undefined
  }

  function startCooldownInterval() {
    stopCooldownInterval()
    const initialCooldown = setCooldown()

    if (initialCooldown > 0) {
      cooldownInterval = setInterval(() => {
        if (setCooldown() === 0) stopCooldownInterval()
      }, ONE_MINUTE_IN_MS)
    }
  }

  async function fetchLatestSession() {
    try {
      const result = await SessionService.getLatestSession()
      latestSession.value = result.sessionData
      startCooldownInterval()
    } catch (err) {
      latestSession.value = {} as LatestSession
      LoggerService.noticeError(
        `Could not set latest session in session store: ${errorFromHttpResponse(err)}`
      )
    }
  }

  function setLatestSession(value: LatestSession) {
    latestSession.value = value
  }

  function setJourneySessionData(value: JourneySessionData) {
    journeySessionData.value = value
  }

  function clearJourneySessionData() {
    journeySessionData.value = undefined
  }

  function setZwibbler(value: Zwibbler | null) {
    zwibbler.value = value
  }

  return {
    isPartnerOnline,
    latestSession,
    cooldownMinutes,
    journeySessionData,
    zwibbler,
    hasCooldown,
    onlineStatusForPartner,
    startCooldownInterval,
    stopCooldownInterval,
    fetchLatestSession,
    setLatestSession,
    setJourneySessionData,
    clearJourneySessionData,
    setZwibbler,
  }
})
