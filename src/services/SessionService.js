import router from '../router'

import NetworkService from './NetworkService'
import UserService from './UserService'

export default {
  loading: false,
  currentSession: {
    sessionId: null,
    data: {},
  },

  getPartner () {
    const user = UserService.getUser()
    const session = this.currentSession.data || {}

    if (user.isVolunteer) {
      return session.student
    }
    return session.volunteer
  },

  endSession (context, sessionId, options = {}) {
    localStorage.removeItem('currentSessionPath')

    return NetworkService.endSession(context, { sessionId }).then(res => {
      const data = res.data || {}
      const { sessionId } = data

      console.log(`ended session: ${sessionId}`)
      this.currentSession.sessionId = null
      this.currentSession.data = {}

      if (!options.skipRoute) {
        router.replace('/feedback')
      }
    })
  },

  newSession (context, sessionType, sessionSubTopic) {
    return NetworkService.newSession(context, {
      sessionType,
      sessionSubTopic
    }).then(res => {
      const data = res.data || {}
      const { sessionId } = data

      this.currentSession.sessionId = sessionId

      
      if (sessionId) {
        const path = `/session/${sessionType}/${sessionSubTopic}/${sessionId}`
        localStorage.setItem('currentSessionPath', path)
        router.replace(path)
        window.analytics.track('Session started', {
          'Session start': new Date().getTime(),
          'Session topic': sessionType,
          'Session subtopic': sessionSubTopic,
          'Session id': sessionId
        })
      } else {
        router.replace('/')
      }
      
      return sessionId
    })
  },

  useExistingSession (context, sessionId) {
    return NetworkService.checkSession(context, { sessionId }).then(res => {
      const data = res.data || {}
      const { sessionId } = data

      this.currentSession.sessionId = sessionId

      console.log(`useExistingSession: ${sessionId}`)
      if (!sessionId) {
        router.replace('/')
      }
      return sessionId
    })
  },

  getCurrentSession (context, user) {
    return NetworkService.currentSession(context, {
      user_id: user._id,
      is_volunteer: user.isVolunteer
    }).then(resp => {
      if (resp.data.err) {
        this.currentSession.sessionId = null
        this.currentSession.data = {}
        console.log('no active session found')

        localStorage.removeItem('currentSessionPath')
        return
      }

      const { sessionId, data } = resp.data || {}
      const { type, subTopic } = data

      if (type && subTopic && sessionId) {
        this.currentSession.sessionId = sessionId
        this.currentSession.data = data
        
        const path = `/session/${type}/${subTopic}/${sessionId}`
        localStorage.setItem('currentSessionPath', path)
      }
    })
  },


}
