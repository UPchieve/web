import UserService from './UserService'

export default {
  // for tracking only when events happen, not tracking any properties
  trackNoProperties (name) {
    window.analytics.track(name)
  },

  /* identifying a user - treats this event differently than a track event 
  because it allows the ability to look at user specific data, and 
  automatically attributes all following events with this user. 
  It should be called when a new user is created, when a user is logged in, 
  and if the parameters about the user that we are tracking are updated (we are
  not currently tracking any user specific info that can be changed, but if
  we were to track their school, a new identify call would have to be called
   when profile is updated) */
  identify (userData) {
    const listPassed = []
    for (var property in userData) {
      if (userData[property].hasOwnProperty('passed')) {
        if (userData[property].passed) {
          listPassed.push(property)
        }
      }
    }
    window.analytics.identify(userData._id, {
      'referred': userData.referred ? userData.referred : 'No',
      'list of passed': listPassed ? listPassed : [],
      'is volunteer': userData.isVolunteer ? 'volunteer' : 'student'
    })
  },


  // tracking the information from the feedback form
  trackFeedback (feedbackComponent) {
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
      'user': feedbackComponent.userType,
      'student id': feedbackComponent.studentId,
      'volunteer id': feedbackComponent.volunteerId,
      'volunteer score': volunteerScore
      // can get answers to specific response using aggResponses
    })
  },

  // tracks when a help session has ended
  trackSessionEnded (headerComponent, currentSession) {
    let volunteerSessionLength  = null
    let waitTime = null
    let volunteerShowed = null
    const timeSessionEnded = new Date()
    const timeCreatedAt = new Date(currentSession.createdAt)
    if (currentSession.volunteerJoinedAt) {
      volunteerShowed = new Date(currentSession.volunteerJoinedAt)
      waitTime = ((volunteerShowed - timeCreatedAt)/60000).toFixed(2)
      volunteerSessionLength = ((timeSessionEnded - volunteerShowed)/60000).toFixed(2)
    }
    const sessionLength = ((timeSessionEnded - timeCreatedAt)/60000).toFixed(2)
    window.analytics.track('session ended', {
      'volunteer session length': (UserService.getUser().isVolunteer) ?
        volunteerSessionLength: null, //if user is volunteer
      'wait time': waitTime,
      'session length': sessionLength,
      'session topic': currentSession.type,
      'session subtopic': currentSession.subTopic,
      'session id': currentSession.sessionId,
      'user': (UserService.getUser().isVolunteer) ? 'volunteer' : 'student',
      'volunteer show time': volunteerShowed ? volunteerShowed: null,
      'did volunteer show': volunteerShowed ? true : false,
      'time ended': new Date() // might be slightly off from the session's "endedAt"
    })
  },

  // tracks when a help session has started
  trackSessionStarted (currentSession, topic, subTopic){
    window.analytics.track('session started', {
        'session started date': new Date(),
        'user': UserService.getUser().isVolunteer
          ? 'volunteer'
          : 'student',
        'session topic': topic,
        'session subtopic': subTopic,
        'session id': currentSession.sessionId
      })
  }
}
