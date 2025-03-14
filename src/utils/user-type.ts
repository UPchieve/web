export function isVolunteerUserType(userType: string): boolean {
  return userType === 'volunteer'
}

export function isStudentUserType(userType: string): boolean {
  return userType === 'student'
}

export function isTeacherUserType(userType: string): boolean {
  return userType === 'teacher'
}

export function hasStudentRole(roles: string[]): boolean {
  return roles.includes('student')
}

export function hasVolunteerRole(roles: string[]): boolean {
  return roles.includes('volunteer')
}

export function isStudentVolunteer(roles: string[]): boolean {
  return hasStudentRole(roles) && hasVolunteerRole(roles)
}
