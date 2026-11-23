import {
  filterMembers,
  memberStatus,
  nextMemberSort,
  sortMembers,
  type MemberFilter,
  type MemberSort,
  type MemberSortKey,
} from '@/services/NTHSMembersTableService'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import { describe, expect, it } from 'vitest'
import { member, NO_PERIOD_ACTIVITY } from '../fixtures/nths'

describe('memberStatus', () => {
  it.each([
    {
      trainingComplete: false,
      safetyApproved: false,
      thisWeek: 2,
      expected: 'needs-training',
    },
    {
      trainingComplete: false,
      safetyApproved: true,
      thisWeek: 2,
      expected: 'needs-training',
    },
    {
      trainingComplete: true,
      safetyApproved: false,
      thisWeek: 2,
      expected: 'needs-approval',
    },
    {
      trainingComplete: true,
      safetyApproved: true,
      thisWeek: 0.5,
      expected: 'active-this-week',
    },
    {
      trainingComplete: true,
      safetyApproved: true,
      thisWeek: 0,
      expected: 'no-hours-this-week',
    },
  ])(
    'is $expected for training $trainingComplete, approved $safetyApproved, $thisWeek hours this week',
    ({ trainingComplete, safetyApproved, thisWeek, expected }) => {
      const subject = member({
        trainingComplete,
        safetyApproved,
        periodHours: { ...NO_PERIOD_ACTIVITY, thisWeek },
      })

      expect(memberStatus(subject)).toBe(expected)
    }
  )
})

const NOW = new Date('2026-10-20T12:00:00.000Z')

function hours(thisSchoolYear: number, thisWeek = 0) {
  return { ...NO_PERIOD_ACTIVITY, thisSchoolYear, thisWeek }
}

const ann = member({
  userId: 'a',
  firstName: 'Ann',
  lastInitial: 'A',
  periodHours: hours(5, 1),
  lastActiveAt: '2026-10-19T12:00:00.000Z',
})
const bob = member({
  userId: 'b',
  firstName: 'Bob',
  lastInitial: 'B',
  periodHours: hours(20),
  safetyApproved: false,
  lastActiveAt: undefined,
  periodSessions: { ...NO_PERIOD_ACTIVITY, allTime: 2 },
})
const cy = member({
  userId: 'c',
  firstName: 'Cy',
  lastInitial: 'C',
  periodHours: hours(9),
  trainingComplete: false,
  safetyApproved: false,
  lastActiveAt: '2026-10-10T12:00:00.000Z',
})
const dee = member({
  userId: 'd',
  firstName: 'Dee',
  lastInitial: 'D',
  periodHours: hours(5),
  periodSessions: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: 10, allTime: 10 },
  lastActiveAt: '2026-10-19T12:00:00.000Z',
})
const roster = [dee, cy, bob, ann]

function names(rows: NTHSRosterMemberPublic[]) {
  return rows.map((row) => row.firstName)
}

describe('filterMembers', () => {
  it.each<[MemberFilter, string[]]>([
    ['everyone', ['Dee', 'Cy', 'Bob', 'Ann']],
    ['needs-training', ['Cy']],
    ['needs-approval', ['Bob']],
    ['no-hours-this-week', ['Dee']],
  ])('%s shows %j', (filter, expected) => {
    expect(names(filterMembers(roster, filter))).toEqual(expected)
  })
})

describe('nextMemberSort', () => {
  it.each<[MemberSort, MemberSortKey, MemberSort]>([
    [
      { key: 'name', direction: 'desc' },
      'hours',
      { key: 'hours', direction: 'asc' },
    ],
    [
      { key: 'hours', direction: 'asc' },
      'hours',
      { key: 'hours', direction: 'desc' },
    ],
    [
      { key: 'hours', direction: 'desc' },
      'hours',
      { key: 'name', direction: 'asc' },
    ],
    [
      { key: 'name', direction: 'asc' },
      'name',
      { key: 'name', direction: 'desc' },
    ],
  ])('from %j pressing %s gives %j', (current, key, expected) => {
    expect(nextMemberSort(current, key)).toEqual(expected)
  })
})

describe('sortMembers', () => {
  it.each<[MemberSort, string[]]>([
    [{ key: 'name', direction: 'asc' }, ['Ann', 'Bob', 'Cy', 'Dee']],
    [{ key: 'name', direction: 'desc' }, ['Dee', 'Cy', 'Bob', 'Ann']],
    [{ key: 'hours', direction: 'asc' }, ['Ann', 'Dee', 'Cy', 'Bob']],
    [{ key: 'hours', direction: 'desc' }, ['Bob', 'Cy', 'Dee', 'Ann']],
    [{ key: 'status', direction: 'asc' }, ['Ann', 'Dee', 'Bob', 'Cy']],
    [{ key: 'status', direction: 'desc' }, ['Cy', 'Bob', 'Dee', 'Ann']],
    [{ key: 'screen', direction: 'asc' }, ['Bob', 'Cy', 'Ann', 'Dee']],
    [{ key: 'screen', direction: 'desc' }, ['Ann', 'Dee', 'Bob', 'Cy']],
    [{ key: 'training', direction: 'asc' }, ['Cy', 'Ann', 'Bob', 'Dee']],
    [{ key: 'training', direction: 'desc' }, ['Ann', 'Bob', 'Dee', 'Cy']],
    [{ key: 'first', direction: 'asc' }, ['Bob', 'Ann', 'Cy', 'Dee']],
    [{ key: 'first', direction: 'desc' }, ['Ann', 'Cy', 'Dee', 'Bob']],
    [{ key: 'days', direction: 'asc' }, ['Ann', 'Dee', 'Cy', 'Bob']],
    [{ key: 'days', direction: 'desc' }, ['Bob', 'Cy', 'Ann', 'Dee']],
  ])('orders by %j as %j', (sort, expected) => {
    expect(names(sortMembers(roster, sort, NOW))).toEqual(expected)
  })
})
