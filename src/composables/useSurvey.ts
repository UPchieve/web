import { ref, computed } from 'vue'
import type { AxiosError } from 'axios'
import LoggerService from '@/services/LoggerService'
import {
  getPostsessionSurvey,
  getPresessionSurvey,
  getImpactStudySurvey,
  submitSurvey,
  SURVEY_TYPES,
} from '@/services/SurveyService'
import {
  type SurveyQuestionDefinition,
  type SurveyUserResponsesMap,
} from '@/services/SurveyService'

type UseSurveyPayload = {
  surveyType: SURVEY_TYPES
  subject?: string
  sessionId?: string
  role?: string
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

  const isSurveyComplete = computed(() => {
    for (const question of survey.value) {
      const response = userResponses.value[question.questionId]
      if (!response.responseId && !response.openResponse) return false
    }
    return true
  })

  function buildUserResponse() {
    const initialResponses: SurveyUserResponsesMap = {}
    survey.value.forEach((question) => {
      initialResponses[question.questionId] = {
        responseId: undefined,
        openResponse: '',
      }
    })

    userResponses.value = initialResponses
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
      const surveyDefinition = await getSurveyDefinition()
      survey.value = surveyDefinition.survey
      surveyId.value = surveyDefinition.surveyId
      surveyTypeId.value = surveyDefinition.surveyTypeId
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
    updateUserResponse,
    handleSurveySubmit,
    initializeSurvey,
    buildUserResponse,
  }
}
