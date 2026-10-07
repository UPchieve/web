export enum GRADES {
  SIXTH = '6th',
  SEVENTH = '7th',
  EIGHTH = '8th',
  NINTH = '9th',
  TENTH = '10th',
  ELEVENTH = '11th',
  TWELFTH = '12th',
  COLLEGE = 'College',
  OTHER = 'Other',
}
export const STATUS = {
  SUBMITTED: 'submitted',
  REJECTED: 'rejected',
  APPROVED: 'approved',
} as const

export const REFERENCE_STATUS = {
  UNSENT: 'unsent',
  SENT: 'sent',
  SUBMITTED: STATUS.SUBMITTED,
  REJECTED: STATUS.REJECTED,
  APPROVED: STATUS.APPROVED,
} as const

export const USER_BAN_REASONS = {
  NON_US_SIGNUP: 'non us signup',
  USED_BANNED_IP: 'used banned ip',
  SESSION_REPORTED: 'session reported',
  BANNED_SERVICE_PROVIDER: 'banned service provider',
  ADMIN: 'admin',
  AUTOMATED_MODERATION: 'automated moderation',
} as const

export const USER_BAN_TYPES = {
  COMPLETE: 'complete',
  SHADOW: 'shadow',
  LIVE_MEDIA: 'live_media',
} as const
