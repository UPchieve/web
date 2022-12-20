import NetworkService from '@/services/NetworkService'
import * as Sentry from '@sentry/browser'
import { backOff } from 'exponential-backoff'

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
        Sentry.captureException(err)
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
        Sentry.captureException(err)
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
  },
}
