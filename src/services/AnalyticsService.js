import UserService from './UserService'

export default {
  //for tracking only when events happen, not tracking any properties
  trackNoProperties (name) {
    window.analytics.track(name)
  },

  /*identifying a user - should be used when new user is created, 
  user is logged in, and when user info is updated*/
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
      referred: userData.referred,
      'listOfPassed': listPassed,
      'is volunteer': userData.isVolunteer ? true : false
    })
  },

  //updating identifying information for when a schedule is updated
  updateIdentify (user, availability) {
    let counter = 0
    for (const day in availability) {
      for (const hour in availability[day]) {
        if (availability[day][hour]) {
          counter++
        }
      }
    }
    window.analytics.identify(user._id, {
      'number hours selected': counter
    })
  },

  //tracking the information from the feedback form
  trackFeedback (feedbackComponent) {
    let aggResponses = []
    let volunteerScore = 0

    //creates an array of an agreggate of all responses and subresponses
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
    //adds to volunteer score
    if (feedbackComponent.userType === 'student') {
      volunteerScore = aggResponses.reduce(function(acc, val) {
        return acc + val
      }, 0)
    }

    //sends information
    window.analytics.track('feedback', {
      'session id': feedbackComponent.sessionId,
      'user': feedbackComponent.userType,
      'student id': feedbackComponent.studentId,
      'volunteer id': feedbackComponent.volunteerId,
      'volunteer score': volunteerScore
      //can get answers to specific response using aggResponses
    })
  },

  //tracks when a help session has ended
  trackSessionEnded (headerComponent, currentSession) {
    let volunteerShowed = null
    let waitTime = null
    let sessionLength = null
    let timeSessionEnded = new Date()
    let timeCreatedAt = new Date(currentSession.createdAt)
    if (currentSession.volunteerJoinedAt) {
      volunteerShowed = new Date(currentSession.volunteerJoinedAt)
    }

    waitTime = ((volunteerShowed - timeCreatedAt)/60000).toFixed(2)
    sessionLength = ((timeSessionEnded - timeCreatedAt)/60000).toFixed(2)

    window.analytics.track('session ended', {
      'wait time': waitTime,
      'session length': sessionLength,
      'session topic': currentSession.type,
      'session subtopic': currentSession.subTopic,
      'session id': headerComponent.sessionId,
      'user': UserService.getUser().isVolunteer ? 'volunteer' : 'student',
      'volunteer show time': volunteerShowed,
      'volunteer showed?': volunteerShowed ? true : false,
      'time ended': new Date() //might be slightly off from the session's "endedAt"
    })
  },

  //tracks when a help session has started
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
