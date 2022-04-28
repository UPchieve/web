export const formatSurveyAnswers = answer => {
  const format = {
    'specific-question': 'Solve a specific question',
    'complete-homework': 'Complete a homework assignment',
    'test-prep': 'Prepare for a quiz/test',
    'check-answers': 'Check my answers',
    'improve-understanding': 'Improve my understanding of a topic',
    other: 'Other'
  }

  return format[answer]
}
