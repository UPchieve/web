import type { ISODateString, Uuid } from './shared'

export type PastStudent = {
  studentId: Uuid
  firstName: string
  sessionId: Uuid
  subjectName: string
  subjectDisplayName: string
  createdAt: ISODateString
  timeTutored: number
}

export type PastStudentsResponse = {
  pastStudents: PastStudent[]
}
