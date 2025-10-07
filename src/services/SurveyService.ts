import type { AxiosResponse } from 'axios'
import { backOff } from 'exponential-backoff'
import NetworkService from './NetworkService'

export type SurveyResponseDefinition = {
  responseId: number
  responseText: string
  responseDisplayPriority: number
  responseDisplayImage?: string
}

export type SurveryUserResponseDefinition = {
  responseId?: number
  response: string
}

export type SurveyQuestionDefinition = {
  displayPriority: number
  questionId: number
  questionText: string
  questionType: string
  responses: SurveyResponseDefinition[]
  userResponse?: SurveryUserResponseDefinition
}

export type SurveyDefinition = {
  surveyId: number
  surveyTypeId: number
  survey: SurveyQuestionDefinition[]
}

export type SurveyUserQuestionResponse = {
  responseId?: number | number[]
  openResponse: string
}

export type SurveyUserResponsesMap = Record<number, SurveyUserQuestionResponse>

export type SurveyQuestionSubmission = {
  questionId: number
  openResponse: string
  responseChoiceId?: number
}

export type SurveySubmissionPayload = {
  surveyId: number
  surveyTypeId: number
  submissions: SurveyQuestionSubmission[]
}

export enum SURVEY_TYPES {
  POSTSESSION = 'postsession',
  PRESESSION = 'presession',
  PROGRESS_REPORT = 'progress-report',
  IMPACT_STUDY = 'impact-study',
}

/**
 *
 * The survey API responses can return the survey definition in a flat format
 * or nested within `response.data.survey`.
 *
 * This function handles both structures by checking for the presence of `surveyId`
 * and `surveyTypeId` either directly on `data` or within `data.survey`.
 *
 * TODO: Move to one response format
 *
 */
function extractSurveyFromResponse(
  response: AxiosResponse<SurveyDefinition | { survey: SurveyDefinition }>
): SurveyDefinition {
  const { data } = response

  if (
    'surveyId' in data &&
    'surveyTypeId' in data &&
    Array.isArray(data.survey)
  )
    return {
      survey: data.survey,
      surveyId: data.surveyId,
      surveyTypeId: data.surveyTypeId,
    }

  const nestedSurvey = data.survey
  if (
    nestedSurvey &&
    'surveyId' in nestedSurvey &&
    'surveyTypeId' in nestedSurvey &&
    Array.isArray(nestedSurvey.survey)
  ) {
    return {
      survey: nestedSurvey.survey,
      surveyId: nestedSurvey.surveyId,
      surveyTypeId: nestedSurvey.surveyTypeId,
    }
  }

  throw new Error('Invalid survey response structure')
}

export async function getSurveyById(
  surveyId: number
): Promise<SurveyDefinition> {
  const response = await NetworkService.getSurveyById(surveyId)
  return extractSurveyFromResponse(response)
}

export async function getPresessionSurvey(
  subjectName: string
): Promise<SurveyDefinition> {
  const response = await NetworkService.getPresessionSurvey(subjectName)
  return extractSurveyFromResponse(response)
}

export async function getPostsessionSurvey(
  subjectName: string,
  sessionId: string,
  role: string
): Promise<SurveyDefinition> {
  const response = await NetworkService.getPostsessionSurvey(
    subjectName,
    sessionId,
    role
  )
  return extractSurveyFromResponse(response)
}

export async function getImpactStudySurvey(): Promise<SurveyDefinition> {
  const response = await NetworkService.getImpactStudySurvey()
  return extractSurveyFromResponse(response)
}

export async function submitSurvey(
  survey: SurveyDefinition,
  userResponses: SurveyUserResponsesMap
) {
  const submissions: SurveyQuestionSubmission[] = []

  survey.survey.forEach((question) => {
    const response = userResponses[question.questionId]
    if (Array.isArray(response.responseId))
      // Create separate submissions for multi select responses
      response.responseId.forEach((respId) => {
        submissions.push({
          questionId: Number(question.questionId),
          responseChoiceId: respId,
          openResponse: response.openResponse,
        })
      })
    else
      submissions.push({
        questionId: Number(question.questionId),
        responseChoiceId: response.responseId ?? undefined,
        openResponse: response.openResponse,
      })
  })

  const payload: SurveySubmissionPayload = {
    surveyId: survey.surveyId as number,
    surveyTypeId: survey.surveyTypeId as number,
    submissions,
  }

  try {
    await backOff(() => NetworkService.submitSurvey(payload))
  } catch {
    throw new Error(
      'Unable to submit the survey at this time. Please try again later.'
    )
  }
}
