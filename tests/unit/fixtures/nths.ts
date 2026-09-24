import type {
  NTHSChapterImpactPublic,
  NTHSChapterMonthPublic,
  NTHSChapterRosterPublic,
  NTHSRosterMemberPublic,
  NTHSTopTutorPublic,
} from '@/services/NTHSGroupService'

export const NO_PERIOD_ACTIVITY: NTHSRosterMemberPublic['periodHours'] = {
  thisWeek: 0,
  lastTwoWeeks: 0,
  thisMonth: 0,
  thisSchoolYear: 0,
  allTime: 0,
}

export function member(
  overrides: Partial<NTHSRosterMemberPublic> = {}
): NTHSRosterMemberPublic {
  return {
    userId: 'u1',
    firstName: 'Alex',
    lastInitial: 'R',
    roleName: 'member',
    joinedAt: '2026-08-01T00:00:00.000Z',
    trainingComplete: true,
    safetyApproved: true,
    accountClosed: false,
    sessionsThisYear: 3,
    hoursThisYear: 2.5,
    periodHours: {
      thisWeek: 1,
      lastTwoWeeks: 1.5,
      thisMonth: 2,
      thisSchoolYear: 2.5,
      allTime: 4,
    },
    periodSessions: {
      thisWeek: 2,
      lastTwoWeeks: 2,
      thisMonth: 3,
      thisSchoolYear: 3,
      allTime: 5,
    },
    lastActiveAt: '2026-10-14T00:00:00.000Z',
    ...overrides,
  }
}

const schoolYear = {
  label: '2026–27',
  startsAt: '2026-07-01T00:00:00.000Z',
  endsAt: '2027-07-01T00:00:00.000Z',
}

export function topTutor(
  overrides: Partial<NTHSTopTutorPublic> = {}
): NTHSTopTutorPublic {
  return {
    userId: 'riley',
    firstName: 'Riley',
    lastInitial: 'K',
    hoursTutored: 4.5,
    sessionsCompleted: 3,
    ...overrides,
  }
}

export function impact(
  overrides: Partial<NTHSChapterImpactPublic & NTHSChapterMonthPublic> = {}
): NTHSChapterImpactPublic & NTHSChapterMonthPublic {
  return {
    groupId: 'group-123',
    schoolYear,
    schoolYearToDate: {
      studentsHelped: 6,
      sessionsCompleted: 9,
      hoursTutored: 7.5,
      membersTutoring: 4,
    },
    allTime: { studentsHelped: 6, sessionsCompleted: 12, hoursTutored: 9 },
    goals: { hoursTutored: 40, membersTutoring: 3 },
    viewerHoursThisMonth: 0,
    ...overrides,
  }
}

export function rosterResponse(
  members: NTHSRosterMemberPublic[],
  extras: Partial<NTHSChapterRosterPublic> = {}
) {
  return {
    data: {
      roster: {
        groupId: 'group-123',
        schoolYear,
        members,
        ...extras,
      },
    },
  }
}
