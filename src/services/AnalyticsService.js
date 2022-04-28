import posthog from 'posthog-js'
import { EVENTS } from '../consts'
import Gleap from 'gleap'

export default {
  identify(userId, name, email, type) {
    posthog.identify(userId)
    Gleap.identify(userId, {
      name,
      email
    })
    Gleap.setCustomData('userType', type)
  },

  updateUser(update) {
    posthog.people.set(update)
  },

  captureEvent(name, properties) {
    posthog.capture(name, properties)
  },

  // unset any of the user's distinctive ids
  reset() {
    posthog.reset()
    // TODO: does this clear identity stuff too?
    Gleap.clearCustomData()
  },

  registerVolunteer(volunteer) {
    const userProperties = {
      userType: 'volunteer'
    }
    if (volunteer.volunteerPartnerOrg)
      userProperties.partner = volunteer.volunteerPartnerOrg
    this.updateUser(userProperties)
    this.captureEvent(EVENTS.ACCOUNT_CREATED, {
      event: EVENTS.ACCOUNT_CREATED
    })
  },

  // tracking the information from the feedback form
  trackFeedback(feedbackComponent, isFakeUser) {
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
      'volunteer score': volunteerScore
      // can get answers to specific response using aggResponses
    })
  },

  // tracks when a help session has ended
  trackSessionEnded(context, currentSession, isFakeUser) {
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
      'successful session': successfulSession
    })
  },

  // tracks when a help session has started
  trackSessionStarted(context, currentSession, topic, subTopic, isFakeUser) {
    if (isFakeUser) return

    const user = context.$store.state.user.user
    window.analytics.track('session started', {
      'session started date': new Date(),
      user: user.isVolunteer ? 'volunteer' : 'student',
      'session topic': topic,
      'session subtopic': subTopic,
      'session id': currentSession.sessionId
    })
  }
}
