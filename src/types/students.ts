import type { ISODateString, Uuid } from './shared'
import type { VolunteerPublicProfileInfoShared } from './sessions'

export type PastVolunteerSession = {
  sessionId: Uuid
  subjectName: string
  subjectDisplayName: string
  createdAt: ISODateString
  timeTutored: number
}

export type PastVolunteer = {
  volunteerId: Uuid
  firstName: string
  numSessions: number
  lastSession: PastVolunteerSession
  isFavorite: boolean
  publicProfileStats: VolunteerPublicProfileInfoShared
}
