import type { AnswerMap, LetterChoice } from '@/services/TrainingService'

export enum UpchieveTrainingCourseKeyEnum {
  CURRENT = 'upchieveTraining',
  LEGACY = 'upchieve101',
}

export type UpchieveTrainingCourse = {
  isComplete: boolean
  progress: number
  name: string
  courseKey: string
  description: string
  modules: UpchieveTrainingCourseModule[]
  completedMaterials: string[]
  requiredCertifications: string[]
}

export type UpchieveTrainingCourseModule = {
  name: string
  key: string
  materials: UpchieveTrainingMaterial[]
  quizKey: string
}

export type UpchieveTrainingMaterial = {
  name: string
  materialKey: string
  isRequired: boolean
}

// The legacy training had multiple materials per module, but the new one has a single material.
export type SimplifiedUpchieveTrainingModule = {
  name: string
  key: string
  material: UpchieveTrainingMaterial
}

export type AnswerChoice = {
  txt: string
  val: LetterChoice
}

export type QuizQuestion = {
  id: number
  questionText: string
  correctAnswer: LetterChoice
  category: string
  subcategory: string
  possibleAnswers: AnswerChoice[]
}

export type QuizResults = {
  didPass: boolean
  numCorrect: number
  answerKey: AnswerMap
  tries: number
}
