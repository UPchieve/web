export type Role = 'admin' | 'member'
export type GroupMember = {
  userId: string
  nthsGroupId: string
  title: string | null
  roleName: Role
  firstName: string
  email: string
}
