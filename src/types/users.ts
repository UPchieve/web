export type UserRole =
  | 'volunteer'
  | 'student'
  | 'teacher'
  | 'admin'
  | 'ambassador'

export type PrimaryUserRole = Exclude<UserRole, 'admin' | 'ambassador'>
export type SessionUserRole = 'student' | 'volunteer'
