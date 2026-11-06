import type { ISODateString, Uuid } from './shared'
import type { VolunteerPublicProfileInfoShared } from './sessions'
import type { VolunteerStatus } from './users'

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

export type PastVolunteersResponse = {
  pastVolunteers: PastVolunteer[]
}

export type VolunteerStatusesResponse = {
  statuses: Record<Uuid, VolunteerStatus>
}
