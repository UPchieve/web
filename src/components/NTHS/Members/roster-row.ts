import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import type {
  RosterMemberAction,
  RosterPeriod,
  RosterSort,
  RosterSortKey,
} from '@/services/NTHSRosterService'

// Shared prop/emit shape for RosterTable.vue and RosterCards.vue, so a change
// to one can't silently drift from the other.
export type RosterRowProps = {
  members: NTHSRosterMemberPublic[]
  // The unfiltered roster, which titles are counted against.
  roster: NTHSRosterMemberPublic[]
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
  (e: 'act', member: NTHSRosterMemberPublic, action: RosterMemberAction): void
  (e: 'sort', key: RosterSortKey): void
}
