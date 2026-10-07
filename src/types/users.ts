import {
  GRADES,
  REFERENCE_STATUS,
  STATUS,
  USER_BAN_REASONS,
  USER_BAN_TYPES,
} from '@/constants/user'
import type { ISODateString, Uuid } from './shared'
import type { Availability } from './availability'
import type { TrainingCoursesPublic } from './training'
import type { StudentAssignmentPublic } from './assignments'

export type UserRole =
  | 'volunteer'
  | 'student'
  | 'teacher'
  | 'admin'
  | 'ambassador'

export type PrimaryUserRole = Exclude<UserRole, 'admin' | 'ambassador'>
export type SessionUserRole = 'student' | 'volunteer'

export type STATUS = (typeof STATUS)[keyof typeof STATUS]
export type REFERENCE_STATUS =
  (typeof REFERENCE_STATUS)[keyof typeof REFERENCE_STATUS]

export type UserBanType = (typeof USER_BAN_TYPES)[keyof typeof USER_BAN_TYPES]
export type UserBanReason =
  (typeof USER_BAN_REASONS)[keyof typeof USER_BAN_REASONS]

export type RoleContextPublic = {
  activeRole: PrimaryUserRole
  legacyRole: PrimaryUserRole
  roles: UserRole[]
}

export type UserSessionStatsPublic = {
  [subjectName: string]: {
    totalRequested: number
    totalHelped: number
    topicName: string
  }
}

export type QuizInfoPublic = {
  passed: boolean
  tries: number
  lastAttemptedAt?: ISODateString
}

export type CertificationsPublic = {
  [subject: string]: QuizInfoPublic
}

export type ReferencePublic = {
  id: Uuid
  firstName: string
  lastName: string
  createdAt: ISODateString
  email: string
  status?: Uppercase<REFERENCE_STATUS>
  sentAt?: ISODateString
  affiliation?: string
  relationshipLength?: string
  patient?: number
  positiveRoleModel?: number
  agreeableAndApproachable?: number
  communicatesEffectively?: number
  trustworthyWithChildren?: number
  rejectionReason?: string
  additionalInfo?: string
}

export type PostsessionSurveyRatingsMetricPublic = {
  selfReportedStudentRating: {
    total: number
    average: number
  }
  selfReportedVolunteerRating: {
    total: number
    average: number
  }
  partnerReportedStudentRating: {
    total: number
    average: number
  }
  partnerReportedVolunteerRating: {
    total: number
    average: number
  }
  // Legacy values
  selfReportedRating: {
    total: number
    average: number
  }
  partnerReportedRating: {
    total: number
    average: number
  }
}

export type SponsorshipPublic = {
  id: Uuid
  name: string
  key: string
}

export type LegacyUserPublic = {
  id: Uuid
  //   TODO: Remove once there are no references to this property
  _id: Uuid
  firstName: string
  firstname: string
  lastName: string
  createdAt: ISODateString
  email: string
  proxyEmail?: string
  verified: boolean
  phone?: string
  college?: string
  userType: UserRole
  isAdmin: boolean
  roles: UserRole[]
  isBanned: boolean
  banType?: UserBanType
  banReason?: UserBanReason
  roleContext: RoleContextPublic
  isTestUser: boolean
  isFakeUser: boolean
  isDeactivated: boolean
  pastSessions: Uuid[]
  pastSessionsByRole: {
    asStudent: Uuid[]
    asVolunteer: Uuid[]
  }
  lastActivityAt?: ISODateString
  referralCode: string
  numReferredVolunteers?: number
  referredBy?: Uuid
  sessionStats: UserSessionStatsPublic
  preferredLanguage: string
  signupSource?: string
  isOnboarded?: boolean
  isApproved?: boolean
  volunteerPartnerOrg?: string
  subjects?: string[]
  activeSubjects?: string[]
  mutedSubjectAlerts?: string[]
  totalActiveCertifications?: number
  availability?: Availability
  certifications?: CertificationsPublic
  availabilityLastModifiedAt?: ISODateString
  trainingCourses?: TrainingCoursesPublic
  occupation?: string[]
  country?: string
  timezone?: string
  totalVolunteerHours?: number
  hoursTutored?: number
  hoursTutoredThisWeek?: number
  elapsedAvailability?: number
  references?: ReferencePublic[]
  photoIdStatus?: string
  uniqueStudentsHelpedCount?: number
  hasCompletedVolunteerTraining?: boolean
  gradeLevel?: GRADES
  schoolName?: string
  schoolId?: Uuid
  studentSchoolId?: Uuid
  latestRequestedSubjects?: string[]
  numberOfStudentClasses?: number
  issuers?: string[]
  studentPartnerOrg?: string
  isSchoolPartner?: boolean
  usesClever?: boolean
  usesGoogle?: boolean
  usesClassLink?: boolean
  studentAssignments?: StudentAssignmentPublic[]
  ratings?: PostsessionSurveyRatingsMetricPublic
  favoriteVolunteers?: Uuid[]
  lastSuccessfulCleverSync?: ISODateString
  sponsorships?: SponsorshipPublic[]
}
