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
