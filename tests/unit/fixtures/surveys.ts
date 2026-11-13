import { page } from '@vitest/browser/context'
import type { SurveyQuestionDefinition } from '@/services/SurveyService'

export const caresQuestion: SurveyQuestionDefinition = {
  questionId: 75,
  questionText: "I feel like someone cares about how I'm doing academically",
  displayPriority: 20,
  questionType: 'multiple choice',
  display: 'scale',
  responses: [
    'Not at all',
    'Sorta but not really',
    'Somewhat',
    'Mostly',
    'A lot',
  ].map((responseText, i) => ({
    responseId: 100 + i,
    responseText,
    responseDisplayPriority: i,
    // As in prod, where these choice rows are shared with the goal question's stars.
    responseDisplayImage: 'https://cdn.upchieve.org/site-images/star.svg',
  })),
}

export const goalQuestion: SurveyQuestionDefinition = {
  questionId: 1,
  questionText: "What is your primary goal for today's session?",
  displayPriority: 10,
  questionType: 'multiple choice',
  responses: [
    {
      responseId: 1,
      responseText: 'Solve a specific question',
      responseDisplayPriority: 1,
    },
  ],
}

export const caresChoices = () =>
  page
    .getByRole('radiogroup', { name: caresQuestion.questionText, exact: true })
    .getByRole('radio')
