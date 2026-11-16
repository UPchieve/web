import { shallowRef } from 'vue'
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

export const useSessionOfferStore = defineStore('sessionOffer', () => {
  const offer = shallowRef<SessionOffer | null>(null)
  let webNotification: Notification | undefined

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

  return { offer, show, clear }
})

function notificationId(sessionId: string) {
  return `session-offer-${sessionId}`
}

function article(word: string) {
  const firstLetter = Array.from(word)[0]?.toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a'
}
