export type Subject = {
  name: string
  displayName: string
  topicName: string
  topicDisplayName: string
  active: boolean
  displayOrder?: number
}

export type TopicSubjects = {
  name: string
  displayName: string
  subjects: Subject[]
}
