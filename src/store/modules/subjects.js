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
        commit('setSubjects', response.data.subjects)
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
        commit('setTraining', response.data.training)
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
    allSubtopics: (state) => {
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
    allSubtopicNames: (state) => {
      return Object.keys(state.subjects)
    },
    sessionRequestTopicCards: (state, getters, rootState, rootGetters) => {
      const rolledOutSubjects =
        rootGetters['featureFlags/subjectRequestRollout']
      return generateTopicCards(
        state.subjects,
        (subject) =>
          !subject.active && !rolledOutSubjects.includes(subject.name)
      )
    },
    quizTopicCards: (state, getters, rootState, rootGetters) => {
      const rolledOutQuizzes = rootGetters['featureFlags/quizRollout']
      return generateTopicCards(
        getters.reformatTrainingToSubjectsMap,
        (quiz) => !quiz.active && !rolledOutQuizzes.includes(quiz.name)
      )
    },
    // This reformats the training data to have the shape of `state.subjects`.
    // This is primarily for creating generating topic cards
    reformatTrainingToSubjectsMap: (state) => {
      const training = Object.values(state.training)
      const formatted = {}
      for (const t of training) {
        // `state.training` has other properties not directly related to certifications
        if (Array.isArray(t) || !t.certifications) continue
        const certData = t
        const quizzes = certData.certifications
        for (const quiz of quizzes) {
          const topic = state.subjects[quiz.key]?.topicName
          formatted[quiz.key] = {
            ...state.subjects[quiz.key],
            topicDashboardOrder: state.training.subjectTypes.find(
              (item) => item.key === topic.key
            )?.trainingOrder,
            active: quiz.active,
          }
        }
      }
      return formatted
    },
    activeTraining: (state, getters, rootState, rootGetters) => {
      const rolledOutQuizzes = rootGetters['featureFlags/quizRollout']
      const activeTraining = {}
      for (const [key, quizData] of Object.entries(state.training)) {
        if (quizData.certifications?.length) {
          const activeQuizzes = quizData.certifications.filter(
            (quiz) =>
              quiz.active ||
              (!quiz.active && rolledOutQuizzes.includes(quiz.key))
          )
          activeTraining[key] = { ...quizData, certifications: activeQuizzes }
        } else if (Array.isArray(quizData)) activeTraining[key] = [...quizData]
      }
      return activeTraining
    },
  },
}
