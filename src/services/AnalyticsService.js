export default {
  // for tracking only when events happen, not tracking any properties
  trackNoProperties(name, isFakeUser) {
    if (isFakeUser) return;

    window.analytics.track(name);
  },

  /* identifying a user - treats this event differently than a track event 
  because it allows the ability to look at user specific data, and 
  automatically attributes all following events with this user. 
  It should be called when a new user is created, when a user is logged in, 
  and if the parameters about the user that we are tracking are updated (we are
  not currently tracking any user specific info that can be changed, but if
  we were to track their school, a new identify call would have to be called
   when profile is updated) */
  identify(userData, isFakeUser) {
    if (isFakeUser) return;

    const listPassed = [];
    for (var property in userData.certifications) {
      if (
        userData.certifications[property] &&
        Object.prototype.hasOwnProperty.call(
          userData.certifications[property],
          "passed"
        )
      ) {
        if (userData.certifications[property].passed) {
          listPassed.push(property);
        }
      }
    }
    window.analytics.identify(userData._id, {
      "list of passed": listPassed ? listPassed : [],
      "is volunteer": userData.isVolunteer ? "volunteer" : "student"
    });
  },

  // tracking the information from the feedback form
  trackFeedback(feedbackComponent, isFakeUser) {
    if (isFakeUser) return;

    let aggResponses = [];
    let volunteerScore = 0;

    // creates an array of an agreggate of all responses and subresponses
    for (var response in feedbackComponent.userResponse) {
      if (typeof feedbackComponent.userResponse[response] === "object") {
        for (var subresponse in feedbackComponent.userResponse[response]) {
          aggResponses.push(
            feedbackComponent.userResponse[response][subresponse]
          );
        }
      } else {
        aggResponses.push(feedbackComponent.userResponse[response]);
      }
    }
    // adds to volunteer score
    if (feedbackComponent.userType === "student") {
      volunteerScore = aggResponses.reduce(function(acc, val) {
        return acc + val;
      }, 0);
    }
    // sends information
    window.analytics.track("feedback", {
      "session id": feedbackComponent.sessionId,
      user: feedbackComponent.userType,
      "student id": feedbackComponent.studentId,
      "volunteer id": feedbackComponent.volunteerId,
      "volunteer score": volunteerScore
      // can get answers to specific response using aggResponses
    });
  },

  // tracks when a help session has ended
  trackSessionEnded(context, currentSession, isFakeUser) {
    if (isFakeUser) return;

    // calculating time-related session info (session length, wait time, etc.)
    let volunteerSessionLength = null;
    let waitTime = null;
    let volunteerShowed = null;
    const timeSessionEnded = new Date();
    const timeCreatedAt = new Date(currentSession.createdAt);

    if (currentSession.volunteerJoinedAt) {
      volunteerShowed = new Date(currentSession.volunteerJoinedAt);
      waitTime = ((volunteerShowed - timeCreatedAt) / 60000).toFixed(2);
      volunteerSessionLength = (
        (timeSessionEnded - volunteerShowed) /
        60000
      ).toFixed(2);
    }

    const sessionLength = ((timeSessionEnded - timeCreatedAt) / 60000).toFixed(
      2
    );

    // getting if messages were exchanged
    let studentMessages = 0;
    let volunteerMessages = 0;
    let successfulSession = false;

    // loops through messages, and counts how many were by student vs. volunteer
    for (var message in currentSession.messages) {
      const isStudentMessage =
        currentSession.messages[message].user === currentSession.student._id;
      const isVolunteerMessage =
        currentSession.volunteer &&
        currentSession.messages[message].user === currentSession.volunteer._id;

      if (isStudentMessage) {
        studentMessages++;
      } else if (isVolunteerMessage) {
        volunteerMessages++;
      }
    }

    // current criteria for a successful session
    if (studentMessages > 0 && volunteerMessages > 0) {
      successfulSession = true;
    }
    const user = context.$store.state.user.user;
    window.analytics.track("session ended", {
      //if volunteer joined then report volunteerSessionLength otherwise report null
      "volunteer session length":
        volunteerSessionLength && user.isVolunteer
          ? volunteerSessionLength
          : null,
      "wait time": waitTime,
      "session length": sessionLength,
      "session topic": currentSession.type,
      "session subtopic": currentSession.subTopic,
      "session id": currentSession.sessionId,
      user: user.isVolunteer ? "volunteer" : "student",
      "volunteer show time": volunteerShowed ? volunteerShowed : null,
      "did volunteer show": volunteerShowed ? true : false,
      "time ended": new Date(), // might be slightly off from the session's "endedAt"
      "successful session": successfulSession
    });
  },

  // tracks when a help session has started
  trackSessionStarted(context, currentSession, topic, subTopic, isFakeUser) {
    if (isFakeUser) return;

    const user = context.$store.state.user.user;
    window.analytics.track("session started", {
      "session started date": new Date(),
      user: user.isVolunteer ? "volunteer" : "student",
      "session topic": topic,
      "session subtopic": subTopic,
      "session id": currentSession.sessionId
    });
  }
};
