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
  return Object.fromEntries(fields.map((key) => [key, allInfo[key]]))
}
