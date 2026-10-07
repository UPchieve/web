import type { TRAINING } from '@/constants/training'

export type TrainingCourseProgressDataPublic = {
  complete: boolean
  progress: number
  completedMaterials: string[]
}

export type TrainingCoursesPublic = {
  [TRAINING.UPCHIEVE_101]: TrainingCourseProgressDataPublic
  [TRAINING.UPCHIEVE_TRAINING]?: TrainingCourseProgressDataPublic
}
