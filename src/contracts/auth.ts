import type { LegacyUserPublic } from '@/types/users'

export type AuthStatusResponse = {
  authenticated: boolean
  isAdmin?: boolean
  totpVerified?: boolean
}

export type LoginResponse = {
  user: LegacyUserPublic
}

export type AuthPayload = {
  email: string
  password: string
}
