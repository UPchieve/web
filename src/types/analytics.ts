import type { GRADES } from '@/constants/user'
import type { ISODateString, Uuid } from './shared'
import type { UserRole } from './users'

type AnalyticPersonPropertiesFields = {
  ucId: Uuid
  userType: UserRole
  createdAt: ISODateString
  totalSessions: number
  banType?: string
  isTestUser: boolean
  hasStudentRole: boolean
  hasVolunteerRole: boolean
  hasTeacherRole: boolean
  onboarded?: boolean
  approved?: boolean
  partner?: string | null
  schoolPartner?: string | null
  partnerSchoolId?: Uuid | null
  partnerSchoolName?: string | null
  gradeLevel?: GRADES | null
  fallIncentiveEnrollmentAt?: ISODateString | null
  usesClever?: boolean
  usesGoogle?: boolean
  hasSubjectCertification?: boolean
  signupSource?: string
  occupation?: string[]
}

// The backend adds certification fields like `algebra: true` to this object.
// We don't have types for those field names yet, so extra fields can use any
// of the value types above, even though certification values should be boolean
export type AnalyticPersonPropertiesPublic = AnalyticPersonPropertiesFields &
  Record<
    string,
    AnalyticPersonPropertiesFields[keyof AnalyticPersonPropertiesFields]
  >
