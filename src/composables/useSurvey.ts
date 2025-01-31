import type { AxiosError } from 'axios'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { EVENTS, QUESTION_TYPES } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import {
  getPostsessionSurvey,
  getPresessionSurvey,
  getImpactStudySurvey,
  submitSurvey,
  SURVEY_TYPES,
  type SurveyDefinition,
  type SurveyUserQuestionResponse,
} from '@/services/SurveyService'
import type {
  SurveyQuestionDefinition,
  SurveyUserResponsesMap,
} from '@/services/SurveyService'
import { impactStudyEnrollment } from '@/services/UserProductFlagsService'
import { getImpactStudyCacheKey } from '@/utils/cache-keys'

type UseSurveyPayload = {
  surveyType: SURVEY_TYPES
  subject?: string
  sessionId?: string
  role?: string
  initialSurvey?: SurveyDefinition
}

export function useSurvey(data: UseSurveyPayload) {
  const error = ref('')
  const isSubmitting = ref(false)
  const loadingMessage = ref('')
  const survey = ref<SurveyQuestionDefinition[]>([])
  const surveyId = ref<number | undefined>(undefined)
  const surveyTypeId = ref<number | undefined>(undefined)
  const surveyRewardAmount = ref(0)
  const userResponses = ref<SurveyUserResponsesMap>({})
  const initialUserResponses = ref<SurveyUserResponsesMap>({})
  const store = useStore()
  const user = computed(() => store.state.user.user)
  const impactStudyCacheKey = computed(() =>
    getImpactStudyCacheKey(user.value.id)
  )

  const isImpactStudySurvey = computed(() => {
    return data.surveyType === SURVEY_TYPES.IMPACT_STUDY
  })

  const isSurveyComplete = computed(() => {
    for (const question of survey.value) {
      const response = userResponses.value[question.questionId]
      if (question.questionType === QUESTION_TYPES.checkBox) {
        if (
          !response.responseId ||
          (Array.isArray(response.responseId) &&
            response.responseId.length === 0)
        )
          return false
      } else {
        if (!response.responseId && !response.openResponse) return false
      }
    }
    return true
  })

  const hasUpdatedUserResponse = computed(() => {
    for (const questionId of Object.keys(userResponses.value)) {
      const numQuestionId = Number(questionId)
      if (
        userResponses.value[numQuestionId].openResponse !==
          initialUserResponses.value[numQuestionId].openResponse ||
        userResponses.value[numQuestionId].responseId !==
          initialUserResponses.value[numQuestionId].responseId
      )
        return true
    }
    return false
  })

  function storeImpactStudyResponsesToCache(
    userResponses: SurveyUserResponsesMap
  ) {
    localStorage.setItem(
      impactStudyCacheKey.value,
      JSON.stringify({
        rewardAmount: surveyRewardAmount.value,
        responses: userResponses,
      })
    )
  }

  function buildUserResponse() {
    const initialResponses: SurveyUserResponsesMap = {}
    let cachedResponses: Record<string, SurveyUserQuestionResponse> | undefined
    if (isImpactStudySurvey.value) {
      const cacheHit = localStorage.getItem(impactStudyCacheKey.value)
      if (cacheHit)
        cachedResponses = JSON.parse(cacheHit).responses as Record<
          string,
          SurveyUserQuestionResponse
        >
    }

    survey.value.forEach((question) => {
      const strQuestionId = question.questionId.toString()
      let responseId: number | number[] | undefined
      let openResponse: string = ''

      if (question.userResponse) {
        responseId = question.userResponse.responseId
        openResponse = question.userResponse.response
      } else if (
        isImpactStudySurvey.value &&
        cachedResponses?.[strQuestionId]
      ) {
        responseId = cachedResponses[strQuestionId].responseId
        openResponse = cachedResponses[strQuestionId].openResponse
      }

      if (question.questionType === QUESTION_TYPES.checkBox) {
        if (typeof responseId === 'number') responseId = [responseId]
        else if (!responseId || !Array.isArray(responseId)) responseId = []
      }

      initialResponses[question.questionId] = {
        responseId,
        openResponse,
      }
    })

    userResponses.value = initialResponses
    initialUserResponses.value = initialResponses
  }

  function updateUserResponse(
    questionId: number,
    responseId: number | undefined,
    response: string = ''
  ) {
    userResponses.value = {
      ...userResponses.value,
      [questionId]: {
        responseId,
        openResponse: response,
      },
    }
    if (isImpactStudySurvey.value)
      storeImpactStudyResponsesToCache(userResponses.value)
  }

  function updateUserResponseMultiselect(
    questionId: number,
    responseId: number
  ) {
    const currentResponse = userResponses.value[questionId]?.responseId

    let updatedResponses: number[] = []

    if (Array.isArray(currentResponse)) {
      if (currentResponse.includes(responseId))
        // Deselect if it's the same response
        updatedResponses = currentResponse.filter((id) => id !== responseId)
      else updatedResponses = [...currentResponse, responseId]
    } else if (typeof currentResponse === 'number') {
      if (currentResponse === responseId)
        // Deselect if it's the same response
        updatedResponses = []
      // Convert to array with both responses
      else updatedResponses = [currentResponse, responseId]
    }

    userResponses.value = {
      ...userResponses.value,
      [questionId]: {
        ...userResponses.value[questionId],
        responseId: updatedResponses,
      },
    }

    if (isImpactStudySurvey.value)
      storeImpactStudyResponsesToCache(userResponses.value)
  }

  function getSurveyDefinition() {
    switch (data.surveyType) {
      case SURVEY_TYPES.PRESESSION:
        if (!data.subject)
          throw new Error('No subject provided for the presession survey')
        return getPresessionSurvey(data.subject)

      case SURVEY_TYPES.POSTSESSION:
        if (!data.subject || !data.sessionId || !data.role)
          throw new Error('Missing parameters for postsession survey')
        return getPostsessionSurvey(data.subject, data.sessionId, data.role)

      case SURVEY_TYPES.IMPACT_STUDY:
        return getImpactStudySurvey()

      default:
        throw new Error(`Unknown survey type: ${data.surveyType}`)
    }
  }

  // TODO: Initialize the survey when this composable is initialized instead of
  // relying on the components to first initialize the survey
  async function initializeSurvey() {
    try {
      if (data.initialSurvey) {
        survey.value = data.initialSurvey.survey
        surveyId.value = data.initialSurvey.surveyId
        surveyTypeId.value = data.initialSurvey.surveyTypeId
        surveyRewardAmount.value = data.initialSurvey.rewardAmount ?? 0
      } else {
        const surveyDefinition = await getSurveyDefinition()
        survey.value = surveyDefinition.survey
        surveyId.value = surveyDefinition.surveyId
        surveyTypeId.value = surveyDefinition.surveyTypeId
        surveyRewardAmount.value = surveyDefinition.rewardAmount ?? 0
      }
      buildUserResponse()
    } catch (err) {
      error.value =
        ((err as AxiosError).response?.data as { err?: string })?.err ||
        (err as Error).message ||
        'Unknown error'
      LoggerService.noticeError(error.value)
      throw new Error(error.value)
    }
  }

  async function handleSurveySubmit() {
    error.value = ''
    try {
      if (!surveyId.value || !surveyTypeId.value)
        throw new Error(
          'Unable to submit unknown survey. Please try again later.'
        )

      await submitSurvey(
        {
          survey: survey.value,
          surveyId: surveyId.value,
          surveyTypeId: surveyTypeId.value,
        },
        userResponses.value
      )
      AnalyticsService.captureEvent(EVENTS.USER_SURVEY_SUBMITTED, {
        surveyType: data.surveyType,
      })
      if (isImpactStudySurvey.value) {
        await impactStudyEnrollment(store, surveyId.value)
        localStorage.removeItem(impactStudyCacheKey.value)
      }
    } catch (err) {
      error.value =
        ((err as AxiosError).response?.data as { err?: string })?.err ||
        (err as Error).message ||
        'Unknown error'
      throw new Error(error.value)
    }
  }

  return {
    userResponses,
    survey,
    surveyId,
    surveyTypeId,
    surveyRewardAmount,
    isSubmitting,
    error,
    loadingMessage,
    isSurveyComplete,
    hasUpdatedUserResponse,
    isImpactStudySurvey,
    updateUserResponse,
    updateUserResponseMultiselect,
    handleSurveySubmit,
    initializeSurvey,
    buildUserResponse,
  }
}
