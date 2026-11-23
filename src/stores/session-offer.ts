import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import store from '@/store'
import SessionService from '@/services/SessionService'
import { socket } from '@/socket'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import * as PresenceService from '@/services/PresenceService'
import type { SessionOffer } from '@/types/sessions'
import sendWebNotification from '@/utils/send-web-notification'
import { useNotificationsStore } from '@/stores/notifications'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'

export type QueueJoiningState =
  | 'joining'
  | 'joined'
  | 'leaving'
  | 'not in queue'
  | 'join failed'
  | 'leave failed'
// why subway removed the coach from the queue (sent with the `queue:left` socket event)
export type LeaveQueueReason =
  | 'manually exited queue'
  | 'inactive'
  | 'joined session'
  | 'switched role'

const IN_QUEUE_STATES = new Set<QueueJoiningState>([
  'joining',
  'joined',
  'leave failed',
])

export const useSessionOfferStore = defineStore('sessionOffer', () => {
  const offer = shallowRef<SessionOffer | null>(null)
  let webNotification: Notification | undefined

  const queueJoiningState = ref<QueueJoiningState>('not in queue')
  const isInQueue = computed(() => IN_QUEUE_STATES.has(queueJoiningState.value))
  // when the coach joined the queue; set only while they're in it
  const inQueueSince = ref<Date | null>(null)
  // why subway last took the coach out of the queue; the dashboard shows a
  // toast while it's set, and clears it when the toast closes
  const leftQueueReason = ref<LeaveQueueReason | null>(null)

  // sets both together, so inQueueSince can't drift from the joining state
  function setQueueStatus(joiningState: QueueJoiningState, since: Date | null) {
    queueJoiningState.value = joiningState
    inQueueSince.value = since
  }

  const isQueueEligible = computed((): boolean => {
    return (
      store.getters['volunteer/isReadyToTutor'] &&
      !store.getters['user/isSessionAlive'] &&
      store.getters['featureFlags/isSessionOffersEnabledForCoach']
    )
  })

  /**
   * Fetches the coach's queue state from subway. Called on app load, and again
   * when the socket reconnects, since a `queue:left` event sent while we were
   * disconnected never reaches us.
   */
  async function loadQueueStatus() {
    try {
      const { isInQueue, inQueueSince: since } =
        await NetworkService.getVolunteerQueueStatus()
      setQueueStatus(
        isInQueue ? 'joined' : 'not in queue',
        since ? new Date(since) : null
      )
    } catch (error) {
      // keep whatever state we had; the next load will try again
      LoggerService.noticeError(error)
    }
  }

  async function joinQueue() {
    setQueueStatus('joining', null)
    try {
      await NetworkService.joinVolunteerQueue()
    } catch (error) {
      LoggerService.noticeError(error)
      AnalyticsService.captureEvent(EVENTS.OFFERS_JOIN_QUEUE_FAILED)
      setQueueStatus('join failed', null)
      return
    }
    // count from now until subway tells us the join time
    setQueueStatus('joined', new Date())
    // subway keeps the original join time if the coach was already in the
    // queue (e.g. joined in another tab), so use its time
    await loadQueueStatus()
  }

  async function leaveQueue() {
    // still in the queue until the leave succeeds, so keep inQueueSince
    setQueueStatus('leaving', inQueueSince.value)
    try {
      await NetworkService.leaveVolunteerQueue()
      setQueueStatus('not in queue', null)
    } catch (error) {
      LoggerService.noticeError(error)
      AnalyticsService.captureEvent(EVENTS.OFFERS_LEAVE_QUEUE_FAILED)
      setQueueStatus('leave failed', inQueueSince.value)
    }
  }

  /**
   * Coaches automatically rejoin the queue after a session ends.
   * This is triggered from subway over the sockets.
   */
  function onJoinedQueue(joinedAt: Date) {
    setQueueStatus('joined', joinedAt)
  }

  function onLeftQueue(reason: LeaveQueueReason) {
    setQueueStatus('not in queue', null)
    leftQueueReason.value = reason
  }

  function clearLeftQueueReason() {
    leftQueueReason.value = null
  }

  function show(newOffer: SessionOffer) {
    if (store.getters['user/isSessionAlive']) return
    if (offer.value) clear(offer.value.sessionId)
    offer.value = newOffer

    const { sessionId, subject, topic, subjectDisplayName } = newOffer
    const studentFirstName = newOffer.studentFirstName ?? 'Student'
    const totalSeconds = Math.floor(
      (new Date(newOffer.expiresAt).getTime() - Date.now()) / 1000
    )
    const captureEvent = (event: string) =>
      AnalyticsService.captureEvent(event, {
        sessionId,
        countOfAvailableSessionsInList:
          store.getters['volunteer/availableSessions'].length,
        countOfExclusiveSessionsInList:
          store.getters['volunteer/exclusiveSessions'].length,
      })

    useNotificationsStore().add(
      {
        id: notificationId(sessionId),
        type: 'session-offer',
        icon: StudentIcon,
        label: 'Your next match',
        title: subjectDisplayName,
        description: studentFirstName,
        cta: {
          text: 'Join',
          action: () => {
            captureEvent(EVENTS.OFFERS_ACCEPTED_SESSION)
            clear(sessionId)
            SessionService.goToSession({
              id: sessionId,
              subTopic: subject,
              type: topic,
            })
          },
        },
        secondaryCta: {
          text: 'Pass',
          action: () => {
            captureEvent(EVENTS.OFFERS_DECLINED_OFFER)
            socket.emit('session-offer:decline', { sessionId })
            clear(sessionId)
          },
        },
        duration: totalSeconds * 1000,
        countdown: true,
        onExpire: () => {
          captureEvent(EVENTS.OFFERS_OFFER_TIMED_OUT)
          clear(sessionId)
        },
        modal: true,
      },
      true
    )
    store.dispatch('volunteer/playAudio')
    webNotification = sendWebNotification(
      `${studentFirstName} has requested ${article(subjectDisplayName)} ${subjectDisplayName} tutor`,
      {
        body: `We're holding this session for you. Accept in the next ${totalSeconds} seconds.`,
        tag: 'session-offer',
      },
      { type: 'session-offer', sessionId }
    )
    captureEvent(EVENTS.OFFERS_SAW_SESSION_OFFER_ALERT)
    PresenceService.checkForInactivity()
  }

  function clear(sessionId: string) {
    if (offer.value?.sessionId !== sessionId) return
    useNotificationsStore().remove(notificationId(sessionId))
    webNotification?.close()
    webNotification = undefined
    offer.value = null
  }

  return {
    offer,
    show,
    clear,
    queueJoiningState,
    isInQueue,
    inQueueSince,
    leftQueueReason,
    loadQueueStatus,
    joinQueue,
    leaveQueue,
    onLeftQueue,
    onJoinedQueue,
    clearLeftQueueReason,
    isQueueEligible,
  }
})

function notificationId(sessionId: string) {
  return `session-offer-${sessionId}`
}

function article(word: string) {
  const firstLetter = Array.from(word)[0]?.toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a'
}
