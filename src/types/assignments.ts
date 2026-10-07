import type { Uuid, ISODateString } from './shared'

export type StudentAssignmentPublic = {
  id: Uuid
  assignedAt: ISODateString
  classId?: Uuid
  className?: string
  description?: string
  title?: string
  numberOfSessions?: number
  minDurationInMinutes?: number
  isRequired: boolean
  dueDate?: ISODateString
  startDate?: ISODateString
  subjectId?: number
  subjectName?: string
  submittedAt?: ISODateString
}
