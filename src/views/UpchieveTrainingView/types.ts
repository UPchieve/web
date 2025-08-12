export type UpchieveTrainingCourse = {
  isComplete: boolean
  progress: number
  name: string
  courseKey: string
  description: string
  modules: UpchieveTrainingCourseModule[]
  completedMaterials: string[]
}

export type UpchieveTrainingCourseModule = {
  name: string
  key: string
  materials: UpchieveTrainingMaterial[]
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
