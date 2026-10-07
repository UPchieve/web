export type AuthStatusResponse = {
  authenticated: boolean
  isAdmin?: boolean
  totpVerified?: boolean
}
