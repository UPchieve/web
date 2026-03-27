import type { UpchieveTrainingCourse } from '@/views/TrainingCourseView/types'

import store from '@/store'

export function isTrainingComplete(): boolean {
  return (
    store.getters['user/hasCompletedVolunteerTraining'] ||
    store.getters['user/hasCertification']()
  )
}

export function getTrainingProgress(
  trainingCourseDefinition: UpchieveTrainingCourse | null,
  completedMaterials: string[]
): number {
  if (isTrainingComplete()) {
    return 100
  }
  if (!trainingCourseDefinition) return 0

  const requiredCerts: string[] =
    trainingCourseDefinition.requiredCertifications ?? []
  const requiredMaterials: string[] = trainingCourseDefinition.modules.reduce(
    (acc, module) => {
      acc.push(
        ...module.materials
          .filter((mat) => mat.isRequired)
          .map((mat) => mat.materialKey)
      )
      return acc
    },
    [] as string[]
  )
  const totalSteps = requiredCerts.length + requiredMaterials.length
  const completedCerts = requiredCerts.filter((cert) =>
    store.getters['user/hasCertification'](cert)
  )
  return Math.floor(
    ((completedCerts.length + completedMaterials.length) / totalSteps) * 100.0
  )
}
