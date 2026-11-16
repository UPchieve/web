import type { ISODateString, Uuid } from './shared'

export type DirectMessageUnavailableReason = 'NOT_ENABLED' | 'UNAVAILABLE'

export type PastStudent = {
  studentId: Uuid
  firstName: string
  sessionId: Uuid
  subjectName: string
  subjectDisplayName: string
  createdAt: ISODateString
  timeTutored: number
  canDirectMessage: boolean
  directMessageUnavailableReason?: DirectMessageUnavailableReason
}

export type PastStudentsResponse = {
  pastStudents: PastStudent[]
}
