import type { ShareInfoFieldKey } from '@/consts'
import type { VolunteerPublicProfileInfoShared } from '@/types/sessions'

export interface ShareableVolunteerData {
  occupations?: string[]
  numSessionsTutored: number
  numStudentsTutored: number
  totalHoursTutored: number
}

export function volunteerDataFromUser(user: any): ShareableVolunteerData {
  return {
    occupations: user?.occupation ?? [],
    numSessionsTutored: user?.numSessionsTutored ?? 0,
    numStudentsTutored: user?.uniqueStudentsHelpedCount ?? 0,
    totalHoursTutored: user?.hoursTutored ?? 0,
  }
}

// Every share-info choice except online status is a field on the coach's
// info card. Online status is shown to students separately, as a live status.
export type ProfileInfoFieldKey = Exclude<ShareInfoFieldKey, 'onlineStatus'>

export function isProfileInfoField(
  key: ShareInfoFieldKey
): key is ProfileInfoFieldKey {
  return key !== 'onlineStatus'
}

export function toPublicProfileInfoShared(
  data: ShareableVolunteerData,
  fields: ShareInfoFieldKey[]
): VolunteerPublicProfileInfoShared {
  const allInfo: VolunteerPublicProfileInfoShared = {
    occupation: data.occupations,
    numSessionsTutored: data.numSessionsTutored,
    numStudentsHelped: data.numStudentsTutored,
    totalVolunteerHours: data.totalHoursTutored,
  }
  return Object.fromEntries(
    fields.filter(isProfileInfoField).map((key) => [key, allInfo[key]])
  )
}
