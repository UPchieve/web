import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import type {
  RosterPeriod,
  RosterSort,
  RosterSortKey,
} from '@/services/NTHSRosterService'

// Shared prop/emit shape for RosterTable.vue and RosterCards.vue, so a change
// to one can't silently drift from the other.
export type RosterRowProps = {
  members: NTHSRosterMemberPublic[]
  now: Date
  period: RosterPeriod
  currentUserId: string
  canManage: boolean
  openMenuUserId?: string
  busyUserIds: ReadonlySet<string>
  sort: RosterSort
}

export type RosterRowEmits = {
  (e: 'toggleMenu', userId: string): void
  (e: 'closeMenu', userId: string): void
  (
    e: 'changeRole',
    member: NTHSRosterMemberPublic,
    role: 'admin' | 'member'
  ): void
  (e: 'remove', member: NTHSRosterMemberPublic): void
  (e: 'sort', key: RosterSortKey): void
}
