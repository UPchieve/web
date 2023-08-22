import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { backOff } from 'exponential-backoff'

function generateTopicCards(subjects, isNotActiveFn) {
  const cards = []
  const topicCards = {}

  for (const subject of Object.values(subjects)) {
    const { topicName } = subject
    if (isNotActiveFn(subject)) continue
    if (!topicCards[topicName]) {
      topicCards[topicName] = {
        topic: subject.topicName,
        title: subject.topicDisplayName,
        subjects: [],
        subtopics: [],
        subtopicDisplayNames: {},
        svg: subject.topicIconLink,
        order: subject.topicDashboardOrder,
        isTutoringCard: true,
      }
    }
    // Create a list of subjects that a topic has
    topicCards[topicName].subjects.push({
      name: subject.name,
      id: subject.id,
      displayName: subject.displayName,
      displayOrder: subject.displayOrder,
    })
  }

  // Sort the subjects for each topic and pull out their key
  // along with their display name
  for (const topicData of Object.values(topicCards)) {
    topicData.subjects.sort((a, b) => a.displayOrder - b.displayOrder)
    for (const subject of topicData.subjects) {
      topicData.subtopics.push(subject.name)
      topicData.subtopicDisplayNames[subject.name] = subject.displayName
    }
    cards.push(topicData)
  }
  cards.sort((a, b) => a.order - b.order)

  return cards
}

export default {
  namespaced: true,
  state: {
    subjects: {},
    training: {},
    isFetchingSubjects: false,
    isFetchingTraining: false,
    fetchingSubjectsError: false,
    fetchingTrainingError: false,
  },
  mutations: {
    setSubjects: (state, subjects) => (state.subjects = subjects),
    setTraining: (state, training) => (state.training = training),
    setIsFetchingSubjects: (state, isFetching) =>
      (state.isFetchingSubjects = isFetching),
    setIsFetchingTraining: (state, isFetching) =>
      (state.isFetchingTraining = isFetching),
    setFetchingSubjectsError: (state, hasError) =>
      (state.fetchingSubjectsError = hasError),
    setFetchingTrainingError: (state, hasError) =>
      (state.fetchingTrainingError = hasError),
  },
  actions: {
    async getSubjects({ commit }) {
      try {
        commit('setIsFetchingSubjects', true)
        const response = await backOff(() => NetworkService.getSubjects())
        commit('setSubjects', response.body.subjects)
      } catch (err) {
        LoggerService.noticeError(err)
        commit('setFetchingSubjectsError', true)
      } finally {
        commit('setIsFetchingSubjects', false)
      }
    },
    async getTrainingSubjects({ commit }) {
      try {
        commit('setIsFetchingTraining', true)
        const response = await backOff(() =>
          NetworkService.getTrainingSubjects()
        )
        commit('setTraining', response.body.training)
      } catch (err) {
        LoggerService.noticeError(err)
        commit('setFetchingTrainingError', true)
      } finally {
        commit('setIsFetchingTraining', false)
      }
    },
  },
  getters: {
    // TODO: remove in subjects-database-hydration flag cleanup
    allSubtopics: state => {
      let subtopicObj = {}

      for (let topic in state.subjects) {
        if (Object.prototype.hasOwnProperty.call(state.subjects, topic)) {
          subtopicObj = Object.assign(
            subtopicObj,
            state.subjects[topic].subtopics
          )
        }
      }

      return subtopicObj
    },
    allSubtopicNames: state => {
      return Object.keys(state.subjects)
    },
    sessionRequestTopicCards: (state, getters, rootState, rootGetters) => {
      const rolledOutSubjects =
        rootGetters['featureFlags/subjectRequestRollout'] ?? []
      return generateTopicCards(
        state.subjects,
        subject => !subject.active && !rolledOutSubjects.includes(subject.name)
      )
    },
    quizTopicCards: (state, getters) => {
      return generateTopicCards(
        getters.reformatTrainingToSubjectsMap,
        subject => !subject.active
      )
    },
    // This reformats the training data to have the shape of `state.subjects`.
    // This is primarily for creating generating topic cards
    reformatTrainingToSubjectsMap: state => {
      const training = Object.values(state.training)
      const formatted = {}
      for (const t of training) {
        // `state.training` has other properties not directly related to certifications
        if (Array.isArray(t) || !t.certifications) continue
        const certData = t
        const certifications = certData.certifications
        for (const cert of certifications) {
          const topic = state.subjects[cert.key]?.topicName
          formatted[cert.key] = {
            ...state.subjects[cert.key],
            topicDashboardOrder: state.training.subjectTypes.find(
              item => item.key === topic.key
            )?.trainingOrder,
            // `state.training` is populated with only active quizzes. We are ensuring
            // the spread from `state.subjects` doesn't overwrite the quiz's `active` status
            active: true,
          }
        }
      }
      return formatted
    },
  },
}
