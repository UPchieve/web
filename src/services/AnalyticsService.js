import Gleap from 'gleap'
import posthog from 'posthog-js'
import config from '../config'
import { EVENTS } from '../consts'
import LoggerService from './LoggerService'

class AnalyticsService {
  static init() {
    if (config.posthogToken) {
      posthog.init(`${config.posthogToken}`, {
        api_host: 'https://p.upchieve.org',
        persistence: 'localStorage+cookie',
        on_xhr_error: req => {
          if (req?.status === 0)
            LoggerService.noticeError(
              new Error('Failed to fetch feature flags from PostHog.')
            )
          LoggerService.noticeError(
            new Error(
              `PostHog - Bad HTTP status: ${req?.status} ${req?.statusText}`
            )
          )
        },
        session_recording: {
          maskTextSelector: '#ph-no-capture',
        },
      })
    }

    if (config.gleapSdkKey) {
      Gleap.initialize(config.gleapSdkKey)
      Gleap.getInstance().softReInitialize()
      Gleap.on('close', () => {
        this.captureEvent(EVENTS.GLEAP_CLOSED)
      })
    }
  }

  static identify(userId, properties) {
    posthog.identify(userId, properties)
    Gleap.identify(userId, properties)
    // Attaches custom data to the feedback submission
    Gleap.setCustomData('userType', properties.userType)
  }

  static updateUser(update) {
    posthog.setPersonProperties(update)
  }

  static captureEvent(name, properties) {
    posthog.capture(name, properties)
  }

  // unset any of the user's distinctive ids
  static reset() {
    posthog.reset()
    Gleap.clearIdentity()
  }

  static registerVolunteer(volunteer) {
    const userProperties = {
      userType: 'volunteer',
    }
    if (volunteer.volunteerPartnerOrg)
      userProperties.partner = volunteer.volunteerPartnerOrg
    this.updateUser(userProperties)
    this.captureEvent(EVENTS.ACCOUNT_CREATED, {
      event: EVENTS.ACCOUNT_CREATED,
    })
  }

  // tracking the information from the feedback form
  static trackFeedback(feedbackComponent, isFakeUser) {
    if (isFakeUser) return

    let aggResponses = []
    let volunteerScore = 0

    // creates an array of an agreggate of all responses and subresponses
    for (var response in feedbackComponent.userResponse) {
      if (typeof feedbackComponent.userResponse[response] === 'object') {
        for (var subresponse in feedbackComponent.userResponse[response]) {
          aggResponses.push(
            feedbackComponent.userResponse[response][subresponse]
          )
        }
      } else {
        aggResponses.push(feedbackComponent.userResponse[response])
      }
    }
    // adds to volunteer score
    if (feedbackComponent.userType === 'student') {
      volunteerScore = aggResponses.reduce(function(acc, val) {
        return acc + val
      }, 0)
    }
    // sends information
    window.analytics.track('feedback', {
      'session id': feedbackComponent.sessionId,
      user: feedbackComponent.userType,
      'student id': feedbackComponent.studentId,
      'volunteer id': feedbackComponent.volunteerId,
      'volunteer score': volunteerScore,
      // can get answers to specific response using aggResponses
    })
  }

  // tracks when a help session has ended
  static trackSessionEnded(context, currentSession, isFakeUser) {
    if (isFakeUser) return

    // calculating time-related session info (session length, wait time, etc.)
    let volunteerSessionLength = null
    let waitTime = null
    let volunteerShowed = null
    const timeSessionEnded = new Date()
    const timeCreatedAt = new Date(currentSession.createdAt)

    if (currentSession.volunteerJoinedAt) {
      volunteerShowed = new Date(currentSession.volunteerJoinedAt)
      waitTime = ((volunteerShowed - timeCreatedAt) / 60000).toFixed(2)
      volunteerSessionLength = (
        (timeSessionEnded - volunteerShowed) /
        60000
      ).toFixed(2)
    }

    const sessionLength = ((timeSessionEnded - timeCreatedAt) / 60000).toFixed(
      2
    )

    // getting if messages were exchanged
    let studentMessages = 0
    let volunteerMessages = 0
    let successfulSession = false

    // loops through messages, and counts how many were by student vs. volunteer
    for (var message in currentSession.messages) {
      const isStudentMessage =
        currentSession.messages[message].user === currentSession.student._id
      const isVolunteerMessage =
        currentSession.volunteer &&
        currentSession.messages[message].user === currentSession.volunteer._id

      if (isStudentMessage) {
        studentMessages++
      } else if (isVolunteerMessage) {
        volunteerMessages++
      }
    }

    // current criteria for a successful session
    if (studentMessages > 0 && volunteerMessages > 0) {
      successfulSession = true
    }
    const user = context.$store.state.user.user
    window.analytics.track('session ended', {
      // if volunteer joined then report volunteerSessionLength otherwise report null
      'volunteer session length':
        volunteerSessionLength && user.isVolunteer
          ? volunteerSessionLength
          : null,
      'wait time': waitTime,
      'session length': sessionLength,
      'session topic': currentSession.type,
      'session subtopic': currentSession.subTopic,
      'session id': currentSession.sessionId,
      user: user.isVolunteer ? 'volunteer' : 'student',
      'volunteer show time': volunteerShowed || null,
      'did volunteer show': !!volunteerShowed,
      'time ended': new Date(), // might be slightly off from the session's "endedAt"
      'successful session': successfulSession,
    })
  }

  // tracks when a help session has started
  static trackSessionStarted(
    context,
    currentSession,
    topic,
    subTopic,
    isFakeUser
  ) {
    if (isFakeUser) return

    const user = context.$store.state.user.user
    window.analytics.track('session started', {
      'session started date': new Date(),
      user: user.isVolunteer ? 'volunteer' : 'student',
      'session topic': topic,
      'session subtopic': subTopic,
      'session id': currentSession.sessionId,
    })
  }
}

class DevAnalyticsService {
  static init() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.init')
  }

  static identify(userId, properties) {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.identify', userId, properties)
  }

  static updateUser(update) {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.updateUser', update)
  }

  static captureEvent(name, properties) {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.captureEvent', name, properties)
  }

  static reset() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.reset')
  }

  static registerVolunteer() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.registerVolunteer')
  }

  static trackFeedback() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.trackFeedback')
  }

  static trackSessionEnded() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.trackSessionEnded')
  }

  static trackSessionStarted() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.trackSessionStarted')
  }
}

function getAnalyticsService() {
  switch (config.nodeEnv) {
    case 'development':
      return DevAnalyticsService
    default:
      return AnalyticsService
  }
}

const service = getAnalyticsService()
export default service
